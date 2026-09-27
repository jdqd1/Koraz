import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { RoutePackageSchema, validateRoutePackage, type RouteActivity, type RoutePackage } from "@cediah/contracts";
import { hashRoutePackage, validateBoundRoutePackage, type BoundValidationContext } from "../src/guided-learning/v2/validation.js";

const uuid = (last: number) => `10000000-0000-4000-8000-${String(last).padStart(12, "0")}`;
const hash = "a".repeat(64);
const rationale = "Umbral editorial inicial de producto para este objetivo sintético.";
const base = (key: string, phase: RouteActivity["phase"], use: RouteActivity["use"], representation: RouteActivity["representation"] = "text") => ({
  key, objectiveKey: "objective", relatedObjectiveKeys: [], phase, kind: "single_choice" as const,
  required: true, sourceKeys: ["guide"], representation, equivalenceKey: key, hints: [], use,
  prompt: `Pregunta ${key}`, payload: { options: [{ key: "yes", text: "Sí" }, { key: "no", text: "No" }], correctKey: "yes", distractorFeedback: { no: "Revisa" } },
  feedback: { explanation: "Explicación", commonError: "", sourceKeys: ["guide"] },
  misconceptionMappings: [], alternativeActivityKey: null,
});

function fixture(): RoutePackage {
  const activities: RouteActivity[] = [
    { ...base("explain", "learn", "learning"), kind: "study", payload: { body: "Explicación sintética", focusSpans: [], assetKey: null, scaffold: "explanation", videoRange: null } },
    { ...base("elaborate", "elaborate", "learning"), kind: "constructed_response", payload: { rubric: [{ key: "criterion", criterion: "Relaciona", example: "Ejemplo" }], modelAnswer: "Respuesta modelo", verificationActivityKey: "recall-one" } },
    base("recall-one", "retrieve", "learning"),
    { ...base("recall-two", "retrieve", "learning"), kind: "short_answer", payload: { acceptedAnswers: ["respuesta"], maxChars: 100, modelAnswer: "respuesta", normalization: "nfkc-lower-space" } },
    base("apply-one", "apply", "learning", "case"),
    base("recall-three", "retrieve", "gate"),
    { ...base("apply-two", "apply", "gate", "diagram"), kind: "sequence", payload: { items: [{ key: "one", text: "Uno" }, { key: "two", text: "Dos" }, { key: "three", text: "Tres" }], acceptedOrders: [["one", "two", "three"]], whyActivityKey: null } },
    base("diagnostic-one", "activate", "diagnostic"),
    base("final-one", "retrieve", "final"),
    base("retention-seven", "retrieve", "retention7"),
    base("retention-thirty", "retrieve", "retention30"),
  ];
  const assessment = (key: string, kind: RoutePackage["assessments"][number]["kind"], candidateActivityKeys: string[], afterUnitKey: string | null = null) => ({ key, kind, afterUnitKey, objectiveKeys: ["objective"], candidateActivityKeys, thresholdPercent: 80, thresholdRationale: rationale });
  return RoutePackageSchema.parse({
    schemaVersion: "2.0", packageKey: "coverage-fixture", revision: 1, locale: "es",
    route: { slug: "coverage-fixture", title: "Ruta sintética", summary: "Sin contenido clínico real", topicLabel: "Tema", audience: "Alumno", discipline: "general", coverKey: "heart" },
    policyVersion: "guided-v2.0",
    sources: [{ key: "guide", kind: "guide", title: "Guía sintética", citation: "Guía de prueba (2026)", locator: { heading: "Sección", sectionPath: ["Unidad"], page: 1 }, documentSha256: hash, excerpt: "Texto sintético verificable", url: null, verification: "verified", checkedAt: "2026-09-26" }],
    assets: [],
    objectives: [{ key: "objective", title: "Aplicar un concepto", unitKey: "unit", verb: "apply", criticality: "core", required: true, prerequisiteKeys: [], sourceKeys: ["guide"], comparisonGroup: null, misconceptions: [] }],
    units: [{ key: "unit", title: "Unidad", objectiveKeys: ["objective"], activityKeys: activities.map((activity) => activity.key), support: "standard", estimatedMinutes: null }],
    activities,
    assessments: [
      assessment("diagnostic", "diagnostic", ["diagnostic-one"]),
      assessment("gate", "unit_gate", ["recall-one", "recall-two", "apply-one", "recall-three", "apply-two"], "unit"),
      assessment("final", "final", ["final-one"]),
      assessment("retention7", "retention7", ["retention-seven"]),
      assessment("retention30", "retention30", ["retention-thirty"]),
    ],
    reviewPlan: { objectiveKeys: ["objective"] }, editorial: { notes: "Revisión sintética", unresolvedIssues: [] },
  });
}

const bindings = { topicContentId: uuid(1), sources: [{ key: "guide", sourceContentId: uuid(2), resourceRevisionId: uuid(3) }], assets: [] };
const context = (): BoundValidationContext => ({
  actorCanPublish: true, topicAvailable: true, contentHash: hashRoutePackage(fixture()), reviewedContentHash: hashRoutePackage(fixture()), reviewActorId: uuid(4),
  sources: [{ key: "guide", sourceContentId: uuid(2), resourceRevisionId: uuid(3), documentSha256: hash, available: true }], assets: [],
});

describe("guided v2 publication validation", () => {
  it("accepts a complete portable fixture with a nonblocking diagnostic warning", () => {
    const result = validateRoutePackage(fixture());
    expect(result).toMatchObject({ scope: "portable", valid: true, publishable: true });
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "OBJECTIVE_COVERAGE", severity: "warning" }));
    expect(result.issues.some((issue) => issue.severity === "error")).toBe(false);
  });

  it("lets the current unbundled CLI publish the complete fixture", () => {
    const dir = mkdtempSync(join(tmpdir(), "koraz-t006-"));
    try {
      const file = join(dir, "complete.koraz-route.json");
      writeFileSync(file, JSON.stringify(fixture()));
      const cli = resolve(import.meta.dirname, "../../../packages/contracts/bin/validate-learning-route.mjs");
      const result = spawnSync(process.execPath, [cli, "--publish", file], { encoding: "utf8" });
      expect(result.status, result.stderr).toBe(0);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it("P04 keeps an incomplete draft valid but blocks missing application, source and reserve", () => {
    const noApplication = fixture();
    for (const activity of noApplication.activities) if (activity.phase === "apply") activity.phase = "retrieve";
    expect(validateRoutePackage(noApplication)).toMatchObject({ valid: true, publishable: false });
    expect(validateRoutePackage(noApplication).issues.some((issue) => issue.code === "OBJECTIVE_COVERAGE")).toBe(true);

    const noSource = fixture();
    noSource.sources = [];
    expect(validateRoutePackage(noSource).issues.some((issue) => issue.code === "REFERENCE_MISSING")).toBe(true);
    expect(validateRoutePackage(noSource).publishable).toBe(false);

    const noReserve = fixture();
    noReserve.activities.find((activity) => activity.key === "final-one")!.use = "learning";
    expect(validateRoutePackage(noReserve).issues.some((issue) => issue.code === "RESERVE_LEAK")).toBe(true);
    expect(validateRoutePackage(noReserve).publishable).toBe(false);
  });

  it("counts equivalence families once and protects reserved pools", () => {
    const pkg = fixture();
    pkg.activities.find((activity) => activity.key === "recall-three")!.equivalenceKey = "recall-one";
    expect(validateRoutePackage(pkg).issues.some((issue) => issue.code === "BANK_TOO_SMALL")).toBe(true);
    const leak = fixture();
    leak.activities.find((activity) => activity.key === "final-one")!.equivalenceKey = "recall-one";
    expect(validateRoutePackage(leak).issues.some((issue) => issue.code === "RESERVE_LEAK")).toBe(true);
  });

  it("C02 rejects broken citation markers and unverified source or image rights", () => {
    const broken = fixture();
    broken.sources[0]!.citation = "turn1search0";
    expect(validateRoutePackage(broken).issues).toContainEqual(expect.objectContaining({ code: "SOURCE_UNRESOLVED", path: "/sources/0/citation" }));
    const unverified = fixture();
    unverified.sources[0]!.verification = "unverified";
    expect(validateRoutePackage(unverified).publishable).toBe(false);
    const image = fixture();
    image.assets.push({ key: "image", mediaType: "image", originalFileName: "synthetic.png", sha256: hash, alt: "", caption: "", sourceKeys: ["guide"], rightsStatus: "unverified", credit: "", width: null, height: null });
    const codes = validateRoutePackage(image).issues.map((issue) => issue.code);
    expect(codes).toContain("ASSET_RIGHTS");
    expect(codes).toContain("ASSET_REQUIRED");
    const unfinished = fixture();
    unfinished.activities[0]!.feedback.explanation = "TODO: completar sustento";
    expect(validateRoutePackage(unfinished).issues).toContainEqual(expect.objectContaining({ code: "OBJECTIVE_COVERAGE", suggestedFix: expect.any(String) }));
  });

  it("requires gates, checkpoint cadence, critical remediation and spatial assets", () => {
    const noGate = fixture();
    noGate.assessments = noGate.assessments.filter((assessment) => assessment.kind !== "unit_gate");
    expect(validateRoutePackage(noGate).issues.some((issue) => issue.code === "CRITICAL_GATE_MISSING")).toBe(true);
    const critical = fixture();
    critical.objectives[0]!.misconceptions = [{ key: "error", description: "Error crítico", critical: true, remediationActivityKey: "recall-one", verificationActivityKeys: ["recall-two"] }];
    expect(validateRoutePackage(critical).issues.some((issue) => issue.code === "CRITICAL_GATE_MISSING")).toBe(true);
    const noVerification = fixture();
    const elaboration = noVerification.activities.find((activity) => activity.key === "elaborate")!;
    if (elaboration.kind !== "constructed_response") throw new Error("Fixture inválida");
    elaboration.payload.verificationActivityKey = null;
    expect(validateRoutePackage(noVerification).issues).toContainEqual(expect.objectContaining({ code: "OBJECTIVE_COVERAGE", path: "/activities/1/payload/verificationActivityKey" }));
    const spatial = fixture();
    spatial.route.discipline = "anatomy";
    spatial.objectives[0]!.verb = "identify";
    expect(validateRoutePackage(spatial).issues.some((issue) => issue.code === "ASSET_REQUIRED")).toBe(true);
    const checkpoint = fixture();
    checkpoint.assessments.push({ key: "extra-checkpoint", kind: "checkpoint", afterUnitKey: "unit", objectiveKeys: ["objective"], candidateActivityKeys: ["recall-one"], thresholdPercent: 80, thresholdRationale: rationale });
    expect(validateRoutePackage(checkpoint).issues.some((issue) => issue.code === "OBJECTIVE_COVERAGE")).toBe(true);
    const threeUnits = fixture();
    threeUnits.units.push(
      { key: "unit-two", title: "Unidad dos", objectiveKeys: [], activityKeys: [], support: "standard", estimatedMinutes: null },
      { key: "unit-three", title: "Unidad tres", objectiveKeys: [], activityKeys: [], support: "standard", estimatedMinutes: null },
    );
    expect(validateRoutePackage(threeUnits).issues).toContainEqual(expect.objectContaining({ code: "OBJECTIVE_COVERAGE", message: expect.stringContaining("Falta checkpoint después de unit-three") }));
  });

  it("requires retrieval and application for an optional objective", () => {
    const pkg = fixture();
    pkg.objectives.push({ key: "optional", title: "Objetivo opcional", unitKey: "unit", verb: "apply", criticality: "detail", required: false, prerequisiteKeys: [], sourceKeys: ["guide"], comparisonGroup: null, misconceptions: [] });
    pkg.units[0]!.objectiveKeys.push("optional");
    expect(validateRoutePackage(pkg).issues).toContainEqual(expect.objectContaining({ code: "OBJECTIVE_COVERAGE", message: expect.stringContaining("objetivo opcional") }));
  });

  it("covers every required objective in its gate and every eligible CORE root in a short diagnostic", () => {
    const pkg = fixture();
    pkg.objectives.push({ key: "second", title: "Segundo CORE", unitKey: "unit", verb: "apply", criticality: "core", required: true, prerequisiteKeys: [], sourceKeys: ["guide"], comparisonGroup: null, misconceptions: [] });
    pkg.units[0]!.objectiveKeys.push("second");
    const issues = validateRoutePackage(pkg).issues;
    expect(issues).toContainEqual(expect.objectContaining({ code: "CRITICAL_GATE_MISSING", message: expect.stringContaining("no comprueba second") }));
    expect(issues).toContainEqual(expect.objectContaining({ code: "OBJECTIVE_COVERAGE", message: expect.stringContaining("no cubre todos los CORE raíz") }));
    expect(issues.filter((issue) => issue.severity === "error").every((issue) => issue.path.startsWith("/") && issue.suggestedFix.length > 10)).toBe(true);
  });

  it("rejects case children launched outside the wrapper", () => {
    const pkg = fixture();
    const child = base("case-child", "apply", "learning", "case");
    const second = base("case-child-two", "apply", "learning", "case");
    const wrapper: RouteActivity = { ...base("case-wrapper", "apply", "learning", "case"), kind: "case", payload: { stages: [{ key: "one", narrative: "Etapa uno", childActivityKey: child.key }, { key: "two", narrative: "Etapa dos", childActivityKey: second.key }] } };
    pkg.activities.push(wrapper, child, second);
    pkg.units[0]!.activityKeys.push(child.key, wrapper.key, second.key);
    const issues = validateRoutePackage(pkg).issues;
    expect(issues.some((issue) => issue.code === "OBJECTIVE_COVERAGE" && issue.path.includes("/payload/stages/0"))).toBe(true);
  });

  it("checks catalog bindings, hash and review only on the server", () => {
    expect(validateBoundRoutePackage(fixture(), bindings, context())).toMatchObject({ scope: "bound", valid: true, publishable: true });
    const edited = fixture();
    edited.route.summary = "Cambio posterior a la revisión";
    const editIssues = validateBoundRoutePackage(edited, bindings, context()).issues.map((issue) => issue.code);
    expect(editIssues).toContain("SOURCE_CHANGED");
    expect(editIssues).toContain("REVIEW_STALE");
    const stale = context();
    stale.reviewedContentHash = "b".repeat(64);
    expect(validateBoundRoutePackage(fixture(), bindings, stale).issues.some((issue) => issue.code === "REVIEW_STALE")).toBe(true);
    const changed = context();
    changed.sources[0]!.documentSha256 = "b".repeat(64);
    expect(validateBoundRoutePackage(fixture(), bindings, changed).issues.some((issue) => issue.code === "SOURCE_CHANGED")).toBe(true);
    const denied = context();
    denied.actorCanPublish = false;
    expect(validateBoundRoutePackage(fixture(), bindings, denied).issues.some((issue) => issue.code === "ACCESS_REVOKED")).toBe(true);
    const unbound = { ...bindings, sources: [] };
    expect(validateBoundRoutePackage(fixture(), unbound, context()).issues.some((issue) => issue.code === "SOURCE_UNRESOLVED")).toBe(true);
    const withAsset = fixture();
    withAsset.assets.push({ key: "image", mediaType: "image", originalFileName: "synthetic.png", sha256: hash, alt: "Esquema sintético", caption: "Esquema", sourceKeys: ["guide"], rightsStatus: "licensed", credit: "Licencia sintética", width: 400, height: 300 });
    const assetBindings = { ...bindings, assets: [{ key: "image", assetId: uuid(5) }] };
    const assetContext = context();
    assetContext.contentHash = hashRoutePackage(withAsset);
    assetContext.reviewedContentHash = assetContext.contentHash;
    assetContext.assets = [{ key: "image", assetId: uuid(5), sha256: hash, rightsStatus: "unverified", available: true }];
    expect(validateBoundRoutePackage(withAsset, assetBindings, assetContext).issues).toContainEqual(expect.objectContaining({ code: "ASSET_RIGHTS", path: "/assets/0/rightsStatus" }));
  });
});
