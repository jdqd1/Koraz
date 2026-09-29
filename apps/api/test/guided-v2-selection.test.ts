import { describe, expect, it } from "vitest";
import { RoutePackageSchema, type RoutePackage } from "@cediah/contracts";
import { rebuildGuidedV2Evidence, type GuidedV2EvidenceEvent, type GuidedV2EvidenceResponse } from "../src/guided-learning/v2/evidence.js";
import { prepareGuidedV2NextAction, selectGuidedV2Diagnostic, type GuidedV2SelectionSnapshot } from "../src/guided-learning/v2/service.js";

const epoch = Date.parse("2026-09-01T12:00:00Z");
const at = (hours = 0) => new Date(epoch + hours * 3600000).toISOString();
function fixture(count = 3): RoutePackage {
  const keys = Array.from({ length: count }, (_, i) => ["core", "other", "child"][i] ?? `root-${i}`);
  const objectives = keys.map((key) => ({ key, title: key, unitKey: `unit-${key}`, verb: "recall", criticality: key === "core" ? "core" : "supporting",
    required: key !== "other", prerequisiteKeys: key === "child" ? ["core"] : [], sourceKeys: [], comparisonGroup: null,
    misconceptions: key === "core" ? [{ key: "confusion", description: "Confusión sintética", critical: true,
      remediationActivityKey: "core-remedy", verificationActivityKeys: ["core-verify", "core-verify-b", "core-reserve"] }] : [] }));
  const activities = keys.flatMap((objectiveKey) => {
    const base = { objectiveKey, relatedObjectiveKeys: [], required: true, sourceKeys: [], hints: [], use: "learning",
      prompt: "Pregunta sintética", feedback: { explanation: "Explicación", commonError: "Confusión", sourceKeys: [] },
      misconceptionMappings: objectiveKey === "core" ? [{ responseKey: "no", misconceptionKey: "confusion" }] : [], alternativeActivityKey: null };
    const study = (suffix: string, scaffold: string, phase = "learn", required = true) => ({ ...base,
      key: `${objectiveKey}-${suffix}`, equivalenceKey: `${objectiveKey}-${suffix}`, kind: "study", phase, representation: "text", required,
      payload: { body: "Fuente sintética", focusSpans: [], assetKey: null, scaffold, videoRange: null } });
    const choice = (suffix: string, use = "learning", required = true, phase = "retrieve") => ({ ...base,
      key: `${objectiveKey}-${suffix}`, equivalenceKey: `${objectiveKey}-${suffix}`, kind: "single_choice", phase, representation: phase === "apply" ? "diagram" : "text", use, required,
      payload: { options: [{ key: "yes", text: "Sí" }, { key: "no", text: "No" }], correctKey: "yes", distractorFeedback: { no: "Confusión" } } });
    return [study("explain", "explanation"), study("example", "worked_example"), study("partial", "partial_example"),
      choice("recall"), choice("recall-b"), choice("apply", "learning", true, "apply"), choice("diagnostic", "diagnostic", false),
      study("remedy", "worked_example", "remediate", false), choice("verify", "learning", false), choice("verify-b", "learning", false),
      choice("reserve", "retention7", false)];
  });
  const assessment = (key: string, kind: string, afterUnitKey: string | null, objectiveKeys: string[], candidateActivityKeys: string[]) => ({ key, kind, afterUnitKey,
    objectiveKeys, candidateActivityKeys, thresholdPercent: 80, thresholdRationale: "Umbral sintético documentado para pruebas." });
  return RoutePackageSchema.parse({ schemaVersion: "2.0", packageKey: "selection", revision: 1, locale: "es",
    route: { slug: "selection-route", title: "Selección", summary: "Fixture", topicLabel: "Tema", audience: "Alumno", discipline: "general", coverKey: "heart" },
    policyVersion: "guided-v2.0", sources: [], assets: [], objectives, activities,
    units: keys.map((key) => ({ key: `unit-${key}`, title: key, objectiveKeys: [key],
      activityKeys: activities.filter((item) => item.objectiveKey === key).map((item) => item.key), support: "full", estimatedMinutes: null })),
    assessments: [assessment("diagnosis", "diagnostic", null, keys, keys.map((key) => `${key}-diagnostic`)),
      assessment("gate-core", "unit_gate", "unit-core", ["core"], ["core-verify"]),
      assessment("checkpoint", "checkpoint", "unit-core", ["core"], ["core-verify-b"]),
      assessment("retention", "retention7", null, ["core"], ["core-reserve"])],
    reviewPlan: { objectiveKeys: keys }, editorial: { notes: "", unresolvedIssues: [] } });
}
function response(definition: RoutePackage, key: string, n = 1, overrides: Partial<GuidedV2EvidenceResponse> = {}): GuidedV2EvidenceResponse {
  const item = definition.activities.find((activity) => activity.key === key)!;
  return { kind: "response", id: `event-${n}`, semanticKey: `answer-${n}`, at: at(n / 100), attemptId: `attempt-${n}`,
    activityKey: key, objectiveKey: item.objectiveKey, equivalenceKey: item.equivalenceKey, phase: item.phase, modality: item.representation,
    purpose: item.use, gradingSource: item.kind === "study" ? "none" : "server", score01: item.kind === "study" ? null : 1,
    responseKey: "yes", assisted: false, valid: true, ...overrides };
}
function snapshot(definition = fixture(), events: GuidedV2EvidenceEvent[] = [], overrides: Partial<GuidedV2SelectionSnapshot> = {}): GuidedV2SelectionSnapshot {
  return { definition, events, evidence: rebuildGuidedV2Evidence(definition, events), sessionAttemptIds: events.flatMap((item) => item.kind === "response" ? [item.attemptId] : []),
    diagnosticStatus: "pending", completedActivityKeys: [], dispensedActivityKeys: [], completedAssessmentKeys: [], openAttempts: [], retentionDue: [], reviewDue: [], ...overrides };
}
const select = (input = snapshot(), hours = 1) => prepareGuidedV2NextAction(input, at(hours));
const completeCore = ["explain", "example", "partial", "recall", "recall-b", "apply"].map((key) => `core-${key}`);
const errorEvents = (definition: RoutePackage) => [response(definition, "core-recall", 1, { score01: 0, responseKey: "no" }), response(definition, "core-remedy", 2)];

describe("T017 diagnostic and branch progression", () => {
  it("P03 preserves editorial root order and an independent optional branch", () => {
    const input = snapshot();
    input.definition.objectives.reverse();
    expect(select(input).availableActivities.map((item) => item.objectiveKey)).toEqual(["core", "other"]);
    expect(select(input).nextAction.key).toBe("core-explain");
    expect(select({ ...input, selectedObjectiveKey: "other" }).nextAction.key).toBe("other-explain");
  });
  it("P11 samples root/CORE only, offers omission and reports short coverage", () => {
    const diagnosis = selectGuidedV2Diagnostic(fixture());
    expect(diagnosis).toMatchObject({ omittable: true, activityKeys: ["core-diagnostic", "other-diagnostic"], coverageWarning: true });
    expect(diagnosis.objectiveKeys).not.toContain("child");
  });
  it("diagnostic selects up to eight distinct families and reports unsampled objectives", () => {
    const definition = fixture(12);
    const diagnosis = selectGuidedV2Diagnostic(definition);
    expect(diagnosis.activityKeys).toHaveLength(8);
    expect(diagnosis.coverageWarning).toBe(false);
    expect(diagnosis.uncoveredObjectiveKeys).toHaveLength(3);
    definition.activities.find((item) => item.key === "other-diagnostic")!.equivalenceKey = "core-diagnostic";
    expect(selectGuidedV2Diagnostic(definition).objectiveKeys).not.toContain("other");
  });
  it.each([0, 1])("P11 diagnostic score %s changes support only, never evidence or gate", (score01) => {
    const definition = fixture();
    const input = snapshot(definition, [response(definition, "core-diagnostic", 1, { score01 })], { diagnosticStatus: "completed" });
    const before = structuredClone(input);
    const result = select(input);
    expect(result.support[0]!.mode).toBe(score01 ? "offer_check" : "full");
    expect(result.nextAction.key).toBe(score01 ? "core-recall" : "core-explain");
    expect(result.support[1]!.mode).toBe("full");
    expect(input.evidence.objectives[0]).toMatchObject({ mastered: false, criticalErrorOpen: false, objectiveScore: null });
    expect(input.evidence.gates[0]!.passed).toBe(false);
    expect(input).toEqual(before);
  });
  it("omitting diagnosis retains full support and does not reduce progress", () => {
    const input = snapshot(undefined, [], { diagnosticStatus: "omitted" });
    expect(select(input).nextAction).toEqual(select(snapshot()).nextAction);
    expect(select(input).support[0]!.scaffoldActivityKeys).toEqual(["core-explain", "core-example", "core-partial"]);
    expect(input.evidence.route.progressPercent).toBe(0);
  });
  it("full support fades in order to the independent activity", () => {
    const input = snapshot();
    for (const [i, key] of ["core-explain", "core-example", "core-partial", "core-recall"].entries()) {
      expect(select(input).nextAction.key).toBe(key);
      if (i < 3) input.completedActivityKeys = [...input.completedActivityKeys, key];
    }
  });
  it("P09 a failed CORE blocks descendants but leaves another branch accessible", () => {
    const definition = fixture();
    const input = snapshot(definition, errorEvents(definition), { selectedObjectiveKey: "child" });
    const result = select(input);
    expect(result.nextAction).toMatchObject({ kind: "remediate", key: "core-verify" });
    expect(result.availableActivities.map((item) => item.objectiveKey)).toEqual(["other"]);
    expect(select({ ...input, selectedObjectiveKey: "other" }).nextAction.key).toBe("other-explain");
    expect(input.evidence.availability.find((item) => item.objectiveKey === "child")!.available).toBe(false);
  });
  it("P09 a 90% average cannot bypass missing CORE mastery; optional failure cannot close a passed gate", () => {
    const input = snapshot();
    input.evidence.objectives[0]!.objectiveScore = 90;
    input.evidence.gates[0]!.score = 90;
    expect(select(input).availableActivities.some((item) => item.objectiveKey === "child")).toBe(false);
    const definition = fixture();
    const events = [response(definition, "core-recall", 1), response(definition, "core-recall-b", 2), response(definition, "core-apply", 3),
      response(definition, "other-recall", 4, { score01: 0 })];
    const passed = snapshot(definition, events);
    expect(passed.evidence.gates[0]!.passed).toBe(true);
    expect(select(passed).availableActivities.some((item) => item.objectiveKey === "child")).toBe(true);
  });
  it("resumes an open attempt before remediating or offering overdue work", () => {
    const definition = fixture();
    const input = snapshot(definition, errorEvents(definition), { selectedObjectiveKey: "child", openAttempts: [{ key: "b", openedAt: at() }, { key: "a", openedAt: at() }] });
    expect(select(input).nextAction).toMatchObject({ kind: "resume", key: "a" });
  });
  it("critical remediation shows source/confusion and example before verification", () => {
    const definition = fixture();
    const input = snapshot(definition, [errorEvents(definition)[0]!], { selectedObjectiveKey: "core" });
    expect(select(input)).toMatchObject({ nextAction: { kind: "remediate", key: "core-remedy" }, remediation: { confusion: "Confusión sintética", misconceptionKey: "confusion" } });
  });
  it("bank exhaustion explicitly waits, excludes reserves and never unlocks the child", () => {
    const definition = fixture();
    const events = [...errorEvents(definition), response(definition, "core-verify", 3, { assisted: true }), response(definition, "core-verify-b", 4, { assisted: true })];
    const input = snapshot(definition, events, { selectedObjectiveKey: "child", sessionAttemptIds: [] });
    const before = structuredClone(input);
    const result = select(input);
    expect(result.nextAction).toMatchObject({ kind: "none", key: null });
    expect(result.remediation).toMatchObject({ bankExhausted: true, availableAfter: at(24.03), editorIncident: true });
    expect(result.availableActivities.some((item) => item.objectiveKey === "child")).toBe(false);
    expect(result.remediation!.activityKey).toBeNull();
    expect(input).toEqual(before);
    expect(select(input, 24.03).nextAction.key).toBe("core-verify");
  });
  it("reveals postpone family reuse; preview and semantic replays do not", () => {
    const definition = fixture();
    const events: GuidedV2EvidenceEvent[] = [...errorEvents(definition), response(definition, "core-verify", 3, { assisted: true }), response(definition, "core-verify-b", 4, { assisted: true }),
      { kind: "reveal", id: "reveal", semanticKey: "reveal", at: at(23), activityKey: "core-verify" }];
    const replay = { ...events[2]!, id: "replay", at: at(23) };
    const preview = response(definition, "core-verify-b", 5, { at: at(23), purpose: "preview" });
    const input = snapshot(definition, [...events, replay, preview], { selectedObjectiveKey: "child", sessionAttemptIds: [] });
    expect(select(input, 24.04).nextAction.key).toBe("core-verify-b");
  });
  it("empty verification bank creates an editorial incident without a made-up date", () => {
    const definition = fixture();
    definition.objectives[0]!.misconceptions[0]!.verificationActivityKeys = ["core-reserve"];
    expect(select(snapshot(definition, errorEvents(definition), { selectedObjectiveKey: "child" })).remediation)
      .toMatchObject({ bankExhausted: true, availableAfter: null, editorIncident: true });
  });
  it("two consecutive failures reinforce explanation; two retries then offer pause", () => {
    const definition = fixture();
    const events = [response(definition, "core-recall", 1, { score01: 0, responseKey: null }), response(definition, "core-recall-b", 2, { score01: 0, responseKey: null })];
    const input = snapshot(definition, events, { completedActivityKeys: ["core-explain", "core-example", "core-partial"] });
    expect(select(input).nextAction.key).toBe("core-explain");
    expect(select(input).support[0]).toMatchObject({ reinforced: true, retryLimitReached: false });
    const third = response(definition, "core-apply", 3, { score01: 0, responseKey: null });
    const paused = select(snapshot(definition, [...events, third], { selectedObjectiveKey: "core" }));
    expect(paused.pausedObjectiveKeys).toEqual(["core"]);
    expect(paused.nextAction.kind).toBe("none");
    expect(paused.pauseOffers[0]!.alternatives).toEqual(["pause", "other_branch", "review_later"]);
    expect(paused.availableActivities.map((item) => item.objectiveKey)).toEqual(["other"]);
  });
  it("critical two-retry limit cannot loop through remediation", () => {
    const definition = fixture();
    const events = [1, 2, 3].map((n) => response(definition, "core-recall", n, { score01: 0, responseKey: "no" }));
    expect(select(snapshot(definition, events, { selectedObjectiveKey: "child" })))
      .toMatchObject({ nextAction: { kind: "none" }, remediation: { pauseOffered: true, alternatives: ["pause", "other_branch", "review_later"] } });
  });
  it("success resets failures; diagnosis, preview, invalid and other sessions cannot exhaust retries", () => {
    const definition = fixture();
    const events = [response(definition, "core-recall", 1, { score01: 0 }), response(definition, "core-recall-b", 2, { score01: 0 }),
      response(definition, "core-apply", 3), response(definition, "core-diagnostic", 4, { score01: 0 }),
      response(definition, "core-recall", 5, { score01: 0, valid: false }), response(definition, "core-recall", 6, { score01: 0, purpose: "preview" })];
    expect(select(snapshot(definition, events)).support[0]!.consecutiveFailures).toBe(0);
    expect(select(snapshot(definition, events.slice(0, 2), { sessionAttemptIds: [] })).support[0]!.consecutiveFailures).toBe(0);
  });
  it("retention precedes review; reviews remain optional alongside available new work", () => {
    const definition = fixture();
    const input = snapshot(definition, [response(definition, "other-explain")], { retentionDue: [{ key: "retention", dueAt: at() }],
      reviewDue: [{ key: "review-other", objectiveKey: "other", dueAt: at() }] });
    expect(select(input).nextAction.kind).toBe("retention");
    expect(select({ ...input, retentionDue: [] }).nextAction.kind).toBe("review");
    expect(select({ ...input, retentionDue: [] }).availableActivities.some((item) => item.objectiveKey === "core")).toBe(true);
  });
  it("review batch is at most ten distinct introduced objectives and deterministically ordered", () => {
    const definition = fixture(15);
    const events = definition.objectives.map((item, i) => response(definition, `${item.key}-explain`, i + 1));
    const input = snapshot(definition, events, { reviewDue: definition.objectives.flatMap((item) => [
      { key: `review-${item.key}`, objectiveKey: item.key, dueAt: at() }, { key: `repeat-${item.key}`, objectiveKey: item.key, dueAt: at() }]) });
    const result = select(input);
    expect(result.reviewBatch).toHaveLength(10);
    expect(new Set(result.reviewBatch.map((item) => item.objectiveKey)).size).toBe(10);
    expect(result.reviewBatch[0]!.objectiveKey).toBe("core");
    expect(select({ ...input, reviewDue: [...input.reviewDue].reverse() }).reviewBatch).toEqual(result.reviewBatch);
    expect(select(snapshot(definition, [], { reviewDue: input.reviewDue })).reviewBatch).toEqual([]);
  });
  it("critical error is first in review even when another debt is older", () => {
    const definition = fixture();
    const input = snapshot(definition, [...errorEvents(definition), response(definition, "other-explain", 3)], {
      selectedObjectiveKey: "other", reviewDue: [{ key: "other-debt", objectiveKey: "other", dueAt: at(-20) }, { key: "core-debt", objectiveKey: "core", dueAt: at() }] });
    expect(select(input).reviewBatch.map((item) => item.key)).toEqual(["core-debt", "other-debt"]);
  });
  it("gate is offered after initial work; diagnosis does not satisfy it", () => {
    const input = snapshot(undefined, [], { completedActivityKeys: completeCore });
    expect(select(input).nextAction).toMatchObject({ kind: "gate", key: "gate-core" });
    expect(select({ ...input, completedAssessmentKeys: ["gate-core"] }).nextAction.kind).toBe("activity");
  });
  it("all initial candidates exhausted yields an explicit date and preserves state", () => {
    const definition = fixture(1);
    const events = ["recall", "recall-b", "apply", "verify", "verify-b"].map((key, i) => response(definition, `core-${key}`, i + 1, { assisted: true }));
    const input = snapshot(definition, events, { completedActivityKeys: ["core-explain", "core-example", "core-partial"] });
    const result = select(input);
    expect(result.nextAction.kind).toBe("none");
    expect(result.exhaustedBanks).toMatchObject([{ objectiveKey: "core", bankExhausted: true, availableAfter: at(24.01) }]);
    expect(input.evidence.objectives[0]!.mastered).toBe(false);
  });
  it("selection exposes keys and reasons, never answers or reserved payloads", () => {
    const serialized = JSON.stringify(select());
    expect(serialized).not.toContain("correctKey");
    expect(serialized).not.toContain("core-reserve");
    expect(serialized).not.toContain("distractorFeedback");
  });
  it("a critical confusion in an optional objective offers targeted remediation without blocking CORE", () => {
    const definition = fixture();
    definition.objectives[1]!.misconceptions = [{ ...definition.objectives[0]!.misconceptions[0]!,
      remediationActivityKey: "other-remedy", verificationActivityKeys: ["other-verify"] }];
    definition.activities.find((item) => item.key === "other-recall")!.misconceptionMappings = [{ responseKey: "no", misconceptionKey: "confusion" }];
    const input = snapshot(definition, [response(definition, "other-recall", 1, { score01: 0, responseKey: "no" })], { selectedObjectiveKey: "other" });
    const result = select(input);
    expect(result.nextAction).toMatchObject({ kind: "remediate", key: "other-remedy" });
    expect(result.remediationOffers[0]!.objectiveKey).toBe("other");
    expect(result.availableActivities.some((item) => item.objectiveKey === "core")).toBe(true);
  });
  it("same-family verification waits a full 24h even after reading the remediation", () => {
    const definition = fixture();
    definition.objectives[0]!.misconceptions[0]!.verificationActivityKeys = ["core-verify"];
    definition.activities.find((item) => item.key === "core-verify")!.equivalenceKey = "core-recall";
    const input = snapshot(definition, errorEvents(definition), { selectedObjectiveKey: "child" });
    expect(select(input).remediation!.bankExhausted).toBe(true);
    expect(select(input, 24.01).nextAction.key).toBe("core-verify");
  });
  it("a passed gate offers checkpoint next; an authorized dispensation does not fabricate responses", () => {
    const definition = fixture();
    const events = [response(definition, "core-recall", 1), response(definition, "core-recall-b", 2), response(definition, "core-apply", 3)];
    const input = snapshot(definition, events, { completedActivityKeys: completeCore.slice(1), dispensedActivityKeys: ["core-explain"] });
    expect(select(input).nextAction).toMatchObject({ kind: "gate", key: "checkpoint" });
    expect(input.events).toHaveLength(3);
  });
  it("future debts/events and semantic duplicate failures do not change today's recommendation", () => {
    const definition = fixture();
    const failure = response(definition, "core-recall", 1, { score01: 0, responseKey: null });
    const input = snapshot(definition, [failure, { ...failure, id: "replay", at: at(.5) },
      response(definition, "core-recall-b", 2, { at: at(3), score01: 0, responseKey: null })],
      { retentionDue: [{ key: "retention", dueAt: at(2) }] });
    expect(select(input).support[0]!.consecutiveFailures).toBe(1);
    expect(select(input).nextAction.kind).toBe("activity");
  });
  it("the diagnostic includes dependent CORE but excludes self-graded constructed responses", () => {
    const definition = fixture();
    definition.objectives[2]!.criticality = "core";
    expect(selectGuidedV2Diagnostic(definition).objectiveKeys).toEqual(["core", "other", "child"]);
    const index = definition.activities.findIndex((item) => item.key === "core-diagnostic");
    definition.activities[index] = RoutePackageSchema.shape.activities.element.parse({ ...definition.activities[index],
      kind: "constructed_response", phase: "elaborate", payload: { rubric: [{ key: "criterion", criterion: "Criterio sintético", example: "Ejemplo" }],
        modelAnswer: "Modelo privado", verificationActivityKey: "core-verify" } });
    expect(selectGuidedV2Diagnostic(definition).objectiveKeys).not.toContain("core");
    definition.assessments[0]!.candidateActivityKeys = ["core-reserve"];
    expect(selectGuidedV2Diagnostic(definition)).toMatchObject({ activityKeys: [], coverageWarning: true });
  });
  it("rejects invalid clocks, unknown branch and cyclic graphs", () => {
    expect(() => prepareGuidedV2NextAction(snapshot(), "2026-09-01T12:00:00")).toThrow("UTC");
    expect(() => select({ ...snapshot(), selectedObjectiveKey: "missing" })).toThrow("rama");
    const definition = fixture();
    definition.objectives[0]!.prerequisiteKeys = ["child"];
    expect(() => select(snapshot(definition))).toThrow("grafo");
  });
});
