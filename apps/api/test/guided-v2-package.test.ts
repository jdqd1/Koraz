import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { RoutePackageSchema, routePackageJsonSchema, validateRoutePackage } from "@cediah/contracts";

const root = resolve(import.meta.dirname, "../../..");
const contracts = resolve(root, "packages/contracts");
const source = { key: "source", kind: "guide", title: "Fuente sintética", citation: "Ejemplo", locator: { heading: "Sección", sectionPath: [], page: 1 }, documentSha256: "a".repeat(64), excerpt: "Texto sintético", url: null, verification: "provided", checkedAt: null };
const base = (kind: string, payload: unknown, suffix: string) => ({
  key: `activity-${suffix}`, objectiveKey: "objective", relatedObjectiveKeys: [], phase: "retrieve", kind,
  required: true, sourceKeys: ["source"], representation: "text", equivalenceKey: `family-${suffix}`,
  hints: [], use: "learning", prompt: "Pregunta sintética", payload,
  feedback: { explanation: "Explicación sintética", commonError: "", sourceKeys: ["source"] },
  misconceptionMappings: [], alternativeActivityKey: null,
});
const activities = [
  base("study", { body: "Texto sintético", focusSpans: [{ start: 0, end: 5 }], assetKey: null, scaffold: "explanation", videoRange: null }, "study"),
  base("single_choice", { options: [{ key: "a", text: "A" }, { key: "b", text: "B" }], correctKey: "a", distractorFeedback: { b: "No" } }, "choice"),
  base("short_answer", { acceptedAnswers: ["respuesta"], maxChars: 100, modelAnswer: "respuesta", normalization: "nfkc-lower-space" }, "short"),
  base("constructed_response", { rubric: [{ key: "criterion", criterion: "Criterio", example: "Ejemplo" }], modelAnswer: "Ejemplo", verificationActivityKey: "activity-choice" }, "constructed"),
  base("match", { presentation: "pairs", prompts: [{ key: "p", text: "P" }], choices: [{ key: "c", text: "C" }], correctByPrompt: { p: "c" }, allowReuse: false, edges: [] }, "match"),
  base("image_target", { assetKey: "image", mode: "hotspot", targets: [{ key: "target", prompt: "Señala", polygon: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }], label: "" }], labels: [], correctLabelByTarget: {}, accessibleAlternativeKey: "activity-choice", masking: "no_labels" }, "image"),
  base("sequence", { items: [{ key: "one", text: "1" }, { key: "two", text: "2" }, { key: "three", text: "3" }], acceptedOrders: [["one", "two", "three"]], whyActivityKey: null }, "sequence"),
  base("case", { stages: [{ key: "stage-one", narrative: "Etapa uno", childActivityKey: "activity-choice" }, { key: "stage-two", narrative: "Etapa dos", childActivityKey: "activity-short" }] }, "case"),
];
const fixture = () => ({
  schemaVersion: "2.0", packageKey: "synthetic-route", revision: 1, locale: "es",
  route: { slug: "synthetic-route", title: "Ruta sintética", summary: "Solo prueba", topicLabel: "Tema", audience: "Estudiantes", discipline: "general", coverKey: "heart" },
  policyVersion: "guided-v2.0", sources: [source],
  assets: [{ key: "image", mediaType: "image", originalFileName: "image.png", sha256: null, alt: "Figura sintética", caption: "", sourceKeys: ["source"], rightsStatus: "owned", credit: "Autor", width: 100, height: 100 }],
  objectives: [{ key: "objective", title: "Relacionar ejemplos", unitKey: "unit", verb: "relate", criticality: "core", required: true, prerequisiteKeys: [], sourceKeys: ["source"], comparisonGroup: null, misconceptions: [] }],
  units: [{ key: "unit", title: "Unidad", objectiveKeys: ["objective"], activityKeys: activities.map((item) => item.key), support: "full", estimatedMinutes: null }],
  activities: structuredClone(activities), assessments: [], reviewPlan: { objectiveKeys: ["objective"] }, editorial: { notes: "", unresolvedIssues: [] },
});

describe("portable guided v2 package", () => {
  it("accepts all eight kinds and keeps publication pending", () => {
    const parsed = RoutePackageSchema.parse(fixture());
    expect(parsed.activities.map((item) => item.kind)).toEqual(["study", "single_choice", "short_answer", "constructed_response", "match", "image_target", "sequence", "case"]);
    expect(validateRoutePackage(parsed)).toMatchObject({ valid: true, publishable: false });
  });
  it("rejects unknown fields, invalid enums and file URLs", () => {
    expect(RoutePackageSchema.safeParse({ ...fixture(), published: true }).success).toBe(false);
    expect(RoutePackageSchema.safeParse({ ...fixture(), route: { ...fixture().route, discipline: "other" } }).success).toBe(false);
    expect(RoutePackageSchema.safeParse({ ...fixture(), sources: [{ ...source, url: "file:///secret" }] }).success).toBe(false);
  });
  it("keeps incomplete editorial references in a structural draft", () => {
    const pkg = fixture();
    pkg.units[0]!.objectiveKeys = ["missing"];
    expect(RoutePackageSchema.safeParse(pkg).success).toBe(true);
    expect(validateRoutePackage(pkg)).toMatchObject({ valid: true, publishable: false });
    expect(validateRoutePackage(pkg).issues.some((issue) => issue.code === "REFERENCE_MISSING")).toBe(true);
  });
  it("rejects inconsistent private answers and malformed response structures", () => {
    const pkg = fixture();
    (pkg.activities[1]!.payload as { correctKey: string }).correctKey = "missing";
    expect(validateRoutePackage(pkg)).toMatchObject({ valid: false, publishable: false });
    const sequence = fixture();
    (sequence.activities[6]!.payload as { acceptedOrders: string[][] }).acceptedOrders = [["one", "one", "three"]];
    expect(validateRoutePackage(sequence).issues.some((issue) => issue.path.includes("acceptedOrders"))).toBe(true);
  });
  it("matches the generated JSON Schema exactly", () => {
    const disk = JSON.parse(readFileSync(resolve(contracts, "schemas/koraz-route-2.0.schema.json"), "utf8"));
    expect(disk).toEqual(routePackageJsonSchema());
    expect(disk.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
  });
  it("uses CLI exit codes 0, 1 and 2", () => {
    const dir = mkdtempSync(join(tmpdir(), "koraz-route-"));
    try {
      const file = join(dir, "test.koraz-route.json");
      writeFileSync(file, JSON.stringify(fixture()));
      const cli = resolve(contracts, "bin/validate-learning-route.mjs");
      const bundle = join(dir, "validator.mjs");
      copyFileSync(resolve(contracts, "bin/validate-learning-route.bundle.mjs"), bundle);
      const run = (...args: string[]) => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
      expect(run(file).status).toBe(0);
      expect(spawnSync(process.execPath, [bundle, file], { cwd: dir, encoding: "utf8", env: { PATH: process.env.PATH ?? "" } }).status).toBe(0);
      expect(run("--publish", file).status).toBe(1);
      writeFileSync(file, JSON.stringify({ ...fixture(), schemaVersion: "3.0" }));
      expect(run(file).status).toBe(2);
      expect(run(join(dir, "missing.koraz-route.json")).status).toBe(2);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
