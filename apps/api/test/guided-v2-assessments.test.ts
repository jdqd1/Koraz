import { describe, expect, it } from "vitest";
import { RoutePackageSchema, V2PublicActivitySchema, type RoutePackage } from "@cediah/contracts";
import { selectAssessmentV2, buildAssessmentPoolsV2, assessmentCoverageV2,
  type AssessmentContextV2, type AssessmentExposureV2, type AssessmentPlanV2 } from "../src/guided-learning/v2/assessments.js";
import { assessmentSegmentManifestV2, guidedV2AttemptManifest } from "../src/guided-learning/v2/manifests.js";
import { prepareGuidedV2AttemptSnapshot, initialGuidedV2AttemptResume } from "../src/guided-learning/v2/service.js";
import { scheduleReviewV2 } from "../src/guided-learning/v2/scheduler.js";

const now = "2026-09-29T12:00:00.000Z";
const versionId = "71000000-0000-4000-8000-000000000006";
const key = (n: number) => `objective-${String(n).padStart(3, "0")}`;
function fixture(): RoutePackage {
  const objectives = Array.from({ length: 24 }, (_, n) => ({ key: key(n), title: key(n), unitKey: `unit-${Math.floor(n / 6)}`,
    verb: "recall", criticality: n % 6 === 0 ? "core" : "high_yield", required: true,
    prerequisiteKeys: [], sourceKeys: [], comparisonGroup: n % 6 === 0 ? "compare" : null, misconceptions: [] }));
  const activities = objectives.flatMap((objective) => [
    ...(["a", "variant", "c", "final", "retention7", "retention30"] as const).map((suffix) => ({
      key: `${objective.key}-${suffix}`, objectiveKey: objective.key, relatedObjectiveKeys: [], phase: "retrieve", required: true,
      sourceKeys: [], representation: suffix === "final" ? "diagram" : suffix === "retention7" ? "table" : suffix === "retention30" ? "image" : "text",
      equivalenceKey: `${objective.key}-${suffix === "variant" ? "a" : suffix}`, hints: ["PRIVATE_HINT"],
      use: ["a", "variant", "c"].includes(suffix) ? "learning" : suffix,
      prompt: `PROMPT_${objective.key}_${suffix}`, feedback: { explanation: `PRIVATE_FEEDBACK_${suffix}`, commonError: "PRIVATE_ERROR", sourceKeys: [] },
      misconceptionMappings: [], alternativeActivityKey: null, kind: "single_choice",
      payload: { options: [{ key: "yes", text: "Sí" }, { key: "no", text: "No" }], correctKey: "yes", distractorFeedback: { no: "PRIVATE_DISTRACTOR" } },
    })),
    { key: `${objective.key}-explain`, objectiveKey: objective.key, relatedObjectiveKeys: [], phase: "learn", required: true,
      sourceKeys: [], representation: "text", equivalenceKey: `${objective.key}-explain`, hints: [], use: "learning", prompt: "Explicación",
      feedback: { explanation: "PRIVATE_STUDY", commonError: "", sourceKeys: [] }, misconceptionMappings: [], alternativeActivityKey: null,
      kind: "study", payload: { body: "Texto sintético", focusSpans: [], assetKey: null, scaffold: "explanation", videoRange: null } },
  ]);
  return RoutePackageSchema.parse({ schemaVersion: "2.0", packageKey: "assessments", revision: 1, locale: "es",
    route: { slug: "assessment-route", title: "Evaluación", summary: "Fixture", topicLabel: "Tema", audience: "Alumno", discipline: "general", coverKey: "heart" },
    policyVersion: "guided-v2.0", sources: [], assets: [], objectives, activities,
    units: Array.from({ length: 4 }, (_, n) => ({ key: `unit-${n}`, title: `Unidad ${n}`, objectiveKeys: objectives.filter((item) => item.unitKey === `unit-${n}`).map((item) => item.key),
      activityKeys: activities.filter((item) => objectives.find((objective) => objective.key === item.objectiveKey)?.unitKey === `unit-${n}`).map((item) => item.key),
      support: "full", estimatedMinutes: null })),
    assessments: (["checkpoint", "final", "retention7", "retention30"] as const).map((kind) => ({
      key: `${kind}-test`, kind, afterUnitKey: kind === "checkpoint" ? "unit-2" : null, objectiveKeys: objectives.map((item) => item.key),
      candidateActivityKeys: activities.filter((item) => kind === "checkpoint" ? item.use === "learning" : item.use === kind).map((item) => item.key),
      thresholdPercent: 80, thresholdRationale: "Umbral sintético explícito para probar selección y cobertura por objetivo." })),
    reviewPlan: { objectiveKeys: objectives.map((item) => item.key) }, editorial: { notes: "", unresolvedIssues: [] } });
}
function context(assessmentKey = "checkpoint-test", overrides: Partial<AssessmentContextV2> = {}): AssessmentContextV2 {
  const definition = fixture();
  const firstMasteredAt = "2026-08-01T12:00:00.000Z";
  let state = scheduleReviewV2(null, { responseId: "first", sessionId: "first", acceptedAt: firstMasteredAt,
    gradingSource: "server", score01: 1, assisted: false, selfRating: null, purpose: "learning", phase: "retrieve", valid: true }, [], firstMasteredAt)!;
  if (assessmentKey === "retention30-test") state = scheduleReviewV2(state, { responseId: "seven", sessionId: "seven", acceptedAt: "2026-08-08T12:00:00.000Z",
    gradingSource: "server", score01: 1, assisted: false, selfRating: null, purpose: "retention7", phase: "retrieve", valid: true }, [], firstMasteredAt)!;
  return { definition, pathVersionId: versionId, assessmentKey, nowUtc: now,
    introducedObjectiveKeys: definition.objectives.slice(0, assessmentKey === "checkpoint-test" ? 18 : 24).map((item) => item.key),
    objectiveStates: [], exposures: [], retentionStates: definition.objectives.map((item) => ({ objectiveKey: item.key, firstMasteredAt, state })), ...overrides };
}
function plan(input = context()): AssessmentPlanV2 {
  const result = selectAssessmentV2(input);
  if (result.status !== "success") throw new Error(JSON.stringify(result));
  return result.plan;
}
const items = (value: AssessmentPlanV2) => value.segments.flatMap((segment) => segment.items);
function exposure(n: number, suffix = "a", overrides: Partial<AssessmentExposureV2> = {}): AssessmentExposureV2 {
  return { semanticKey: `exposure-${n}-${suffix}`, at: "2026-09-28T12:00:00.000Z", objectiveKey: key(n),
    equivalenceKey: `${key(n)}-${suffix}`, modality: "text", audience: "student", kind: "presentation", ...overrides };
}
function manifest(value = plan(context("final-test")), overrides: Partial<Parameters<typeof assessmentSegmentManifestV2>[0]> = {}) {
  return assessmentSegmentManifestV2({ plan: value, segmentKey: value.segments[0]!.key, activeIndex: 0,
    mode: "assessment", submittedSegmentKeys: [], responses: [], ...overrides });
}

describe("T019 frozen assessment selection", () => {
  it("P14 mixes recent/prior introduced units, prioritizes unresolved CORE and excludes the future unit", () => {
    const selected = plan();
    expect(selected.segments.map((segment) => segment.items.length)).toEqual([10, 8]);
    expect(items(selected)).toHaveLength(18);
    expect(items(selected).slice(0, 3).every((item) => item.comparisonGroup === "compare")).toBe(true);
    expect(new Set(items(selected).slice(0, 3).map((item) => item.activity.objectiveKey))).toEqual(new Set([key(0), key(6), key(12)]));
    expect(items(selected).some((item) => item.objectiveKey === key(18))).toBe(false);
    expect(selected.segments[0]!.items.filter((item) => item.recent)).toHaveLength(5);
    expect(new Set(items(selected).map((item) => item.objectiveKey)).size).toBe(18);
  });
  it("CORE critical errors come before unevidenced CORE and rotation never skips required objectives", () => {
    const selected = plan(context("checkpoint-test", { objectiveStates: [{ objectiveKey: key(6), mastered: true, criticalErrorOpen: true }],
      exposures: Array.from({ length: 10 }, (_, i) => exposure(1, "a", { semanticKey: `many-${i}` })) }));
    expect(items(selected)[0]!.objectiveKey).toBe(key(6));
    expect(items(selected).map((item) => item.objectiveKey)).toContain(key(1));
    expect(items(selected).findIndex((item) => item.objectiveKey === key(1))).toBeGreaterThan(items(selected).findIndex((item) => item.objectiveKey === key(2)));
  });
  it("P15 pools are disjoint by family and malformed reserve sharing is rejected", () => {
    const definition = fixture();
    expect(buildAssessmentPoolsV2(definition).status).toBe("success");
    definition.activities.find((item) => item.key === `${key(0)}-retention7`)!.equivalenceKey = `${key(0)}-final`;
    expect(selectAssessmentV2(context("final-test", { definition }))).toMatchObject({ status: "invalid", code: "RESERVE_LEAK", leakedFamilies: [`${key(0)}-final`] });
    definition.activities.find((item) => item.key === `${key(0)}-retention7`)!.equivalenceKey = `${key(0)}-a`;
    expect(buildAssessmentPoolsV2(definition).status).toBe("invalid");
  });
  it("final and deferred tests cover every required objective in segments of ten and use distinct reserves", () => {
    const finals = plan(context("final-test"));
    const seven = plan(context("retention7-test"));
    const thirty = plan(context("retention30-test"));
    for (const selected of [finals, seven, thirty]) {
      expect(selected.segments.map((segment) => segment.items.length)).toEqual([10, 10, 4]);
      expect(new Set(items(selected).map((item) => item.objectiveKey)).size).toBe(24);
      expect(items(selected).every((item) => item.activity.use === selected.kind)).toBe(true);
    }
    const families = [...items(finals), ...items(seven), ...items(thirty)].map((item) => item.equivalenceKey);
    expect(new Set(families).size).toBe(72);
  });
  it("missing banks block explicitly and never substitute another reserve or a practice item", () => {
    const input = context("retention30-test");
    input.definition.assessments.find((item) => item.key === input.assessmentKey)!.candidateActivityKeys = [];
    expect(selectAssessmentV2(input)).toMatchObject({ status: "blocked", code: "BANK_EXHAUSTED", objectiveKeys: input.introducedObjectiveKeys });
  });
  it("deferred selection consumes UTC agenda, includes overdue objectives before route completion, and records actual days", () => {
    const input = context("retention7-test");
    input.retentionStates = input.retentionStates!.slice(0, 1);
    input.introducedObjectiveKeys = [key(0)];
    const selected = plan(input);
    expect(selected.requiredObjectiveKeys).toEqual([key(0)]);
    expect(items(selected)[0]).toMatchObject({ daysSinceMastery: 59, outsideRetentionWindow: true });
    expect(selectAssessmentV2({ ...input, nowUtc: "2026-08-07T12:00:00Z" })).toMatchObject({ status: "blocked", code: "RETENTION_NOT_DUE" });
    expect(items(plan({ ...input, nowUtc: "2026-08-08T12:00:00Z" }))[0]).toMatchObject({ daysSinceMastery: 7, outsideRetentionWindow: false });
    expect(selectAssessmentV2({ ...input, assessmentKey: "retention30-test" })).toMatchObject({ status: "blocked", code: "RETENTION_NOT_DUE" });
  });
  it("day30 respects a late first measurement plus seven days and does not synthesize an absence failure", () => {
    const input = context("retention30-test");
    const firstMasteredAt = "2026-08-01T12:00:00.000Z";
    const base = input.retentionStates![0]!;
    const state = { ...base.state, retention7AcceptedAt: "2026-09-25T12:00:00Z", retention30DueAt: "2026-10-02T12:00:00Z" };
    input.retentionStates = [{ objectiveKey: key(0), firstMasteredAt, state }];
    expect(selectAssessmentV2(input)).toMatchObject({ status: "blocked", code: "RETENTION_NOT_DUE" });
    expect(items(plan({ ...input, nowUtc: "2026-10-02T12:00:00Z" }))[0]).toMatchObject({ outsideRetentionWindow: true });
    expect(input.retentionStates[0]!.state.lapses).toBe(0);
  });
  it("final cannot silently omit unintroduced required objectives or objectives omitted editorially", () => {
    const input = context("final-test", { introducedObjectiveKeys: [key(0)] });
    expect(selectAssessmentV2(input)).toMatchObject({ status: "blocked", code: "OBJECTIVES_NOT_INTRODUCED" });
    const complete = context("final-test");
    complete.definition.assessments.find((item) => item.key === "final-test")!.objectiveKeys.pop();
    expect(selectAssessmentV2(complete)).toMatchObject({ status: "blocked", code: "BANK_EXHAUSTED", objectiveKeys: [key(23)] });
  });
  it("optional objectives do not increase the final denominator", () => {
    const input = context("final-test");
    input.definition.objectives[23]!.required = false;
    const selected = plan(input);
    expect(selected.requiredObjectiveKeys).toHaveLength(23);
    expect(items(selected).map((item) => item.objectiveKey)).not.toContain(key(23));
  });
  it("avoids exposed/equivalent families when an independent candidate remains", () => {
    const selected = plan(context("checkpoint-test", { exposures: [exposure(0)] }));
    expect(items(selected).find((item) => item.objectiveKey === key(0))).toMatchObject({ activity: { key: `${key(0)}-c` }, novelAtPresentation: true });
    const input = context("checkpoint-test", { exposures: [exposure(0)] });
    input.definition.assessments[0]!.candidateActivityKeys = input.definition.assessments[0]!.candidateActivityKeys.filter((candidate) => candidate !== `${key(0)}-c`);
    expect(items(plan(input)).find((item) => item.objectiveKey === key(0))).toMatchObject({ novelAtPresentation: false, previousExposureAt: exposure(0).at });
  });
  it("P15 repeating a failed final is not novel transfer, even when the activity ID changes", () => {
    const input = context("final-test", { exposures: [exposure(0, "final", { kind: "response", modality: "diagram" }), exposure(0, "a")] });
    const selected = items(plan(input)).find((item) => item.objectiveKey === key(0))!;
    expect(selected).toMatchObject({ novelAtPresentation: false, newModality: false, transferCandidate: false });
    const old = input.definition.activities.find((item) => item.key === `${key(0)}-final`)!;
    old.key = `${key(0)}-final-renamed`;
    input.definition.units[0]!.activityKeys = input.definition.units[0]!.activityKeys.map((item) => item === `${key(0)}-final` ? old.key : item);
    input.definition.assessments.find((item) => item.kind === "final")!.candidateActivityKeys[0] = old.key;
    expect(items(plan(input))[0]!.novelAtPresentation).toBe(false);
  });
  it("first presentation in a new representation is eligible metadata, not an awarded transfer score", () => {
    const selected = items(plan(context("final-test", { exposures: [exposure(0)] })))[0]!;
    expect(selected).toMatchObject({ novelAtPresentation: true, newModality: true, transferCandidate: true, previousModalities: ["text"] });
    expect(items(plan(context("final-test")))[0]!.transferCandidate).toBe(false);
  });
  it("reveal and learner preview exposures count, editor preview/future events do not, duplicates are stable", () => {
    const exposed = exposure(0, "final", { kind: "reveal" });
    expect(items(plan(context("final-test", { exposures: [exposed] })))[0]!.novelAtPresentation).toBe(false);
    expect(items(plan(context("final-test", { exposures: [{ ...exposed, kind: "preview" }] })))[0]!.novelAtPresentation).toBe(false);
    expect(items(plan(context("final-test", { exposures: [{ ...exposed, audience: "editor" }, { ...exposed, semanticKey: "future", at: "2026-09-30T12:00:00Z" }] })))[0]!.novelAtPresentation).toBe(true);
    expect(plan(context("final-test", { exposures: [exposed, exposed] }))).toEqual(plan(context("final-test", { exposures: [exposed] })));
  });
  it("the private selection is immutable and detached from later editorial changes", () => {
    const input = context("final-test");
    const selected = plan(input);
    const before = JSON.stringify(selected);
    expect(Object.isFrozen(selected)).toBe(true);
    expect(Object.isFrozen(selected.segments[0]!.items[0]!.activity.payload)).toBe(true);
    input.definition.activities.find((item) => item.use === "final")!.prompt = "CHANGED";
    input.exposures = [exposure(0, "final")];
    expect(JSON.stringify(selected)).toBe(before);
    expect(plan(input).selectionHash).not.toBe(selected.selectionHash);
  });
  it("selection is deterministic even if exposure input order changes", () => {
    const exposures = [exposure(0), exposure(1), exposure(0, "final")];
    expect(plan(context("final-test", { exposures }))).toEqual(plan(context("final-test", { exposures: [...exposures].reverse() })));
  });
  it("coverage remains incomplete after the first ten; omissions score zero in the full denominator", () => {
    const selected = plan(context("final-test"));
    const first = selected.segments[0]!;
    const answers = first.items.map((item) => ({ activityKey: item.activity.key, score01: 1, assisted: false, gradingSource: "server" as const }));
    expect(assessmentCoverageV2(selected, [first.key], answers)).toMatchObject({ covered: false, macroPercent: 100 * 10 / 24 });
    const submitted = selected.segments.map((segment) => segment.key);
    expect(assessmentCoverageV2(selected, submitted, answers)).toMatchObject({ covered: true, macroPercent: 100 * 10 / 24 });
    expect(assessmentCoverageV2(selected, submitted, answers).omittedObjectiveKeys).toHaveLength(14);
    expect(assessmentCoverageV2(selected, submitted, items(selected).map((item) => ({ activityKey: item.activity.key, score01: 1, assisted: false, gradingSource: "server" })))).toMatchObject({ covered: true, macroPercent: 100 });
  });
  it("unknown/duplicated answers and unknown segments cannot forge coverage", () => {
    const selected = plan(context("final-test"));
    const answer = { activityKey: items(selected)[0]!.activity.key, score01: 1, assisted: false, gradingSource: "server" as const };
    expect(() => assessmentCoverageV2(selected, ["foreign"], [])).toThrow();
    expect(() => assessmentCoverageV2(selected, [], [answer, answer])).toThrow();
    expect(() => assessmentCoverageV2(selected, [], [{ ...answer, activityKey: "foreign" }])).toThrow();
  });
  it("self and assisted answers cannot inflate objective scores", () => {
    const selected = plan(context("final-test"));
    const responses = items(selected).map((item) => ({ activityKey: item.activity.key, score01: 1, assisted: true, gradingSource: "server" as const }));
    expect(assessmentCoverageV2(selected, selected.segments.map((segment) => segment.key), responses).macroPercent).toBe(0);
  });
  it("unknown assessments, invalid UTC, foreign introduction and cyclic DAG fail explicitly", () => {
    expect(selectAssessmentV2(context("foreign"))).toMatchObject({ status: "invalid" });
    expect(() => plan(context("final-test", { nowUtc: "bad" }))).toThrow();
    expect(() => plan(context("final-test", { introducedObjectiveKeys: ["foreign"] }))).toThrow();
    const input = context(); input.definition.objectives[0]!.prerequisiteKeys = [key(0)];
    expect(() => selectAssessmentV2(input)).toThrow();
  });
});

describe("T019 public assessment manifests", () => {
  it.each(["final-test", "retention7-test", "retention30-test"])("P15 practice/student preview expose no reserved %s item", (assessmentKey) => {
    const selected = plan(context(assessmentKey));
    for (const mode of ["practice", "student_preview"] as const) {
      expect(manifest(selected, { mode })).toMatchObject({ activeActivity: null, acceptedResponses: [] });
      expect(JSON.stringify(manifest(selected, { mode }))).not.toContain("PROMPT_");
    }
  });
  it("public projection delivers the active question only, no private solution, hint, family or future prompt", () => {
    const selected = plan(context("final-test"));
    const publicValue = manifest(selected);
    expect(V2PublicActivitySchema.safeParse(publicValue.activeActivity).success).toBe(true);
    expect(publicValue.activeActivity?.key).toBe(items(selected)[0]!.activity.key);
    const json = JSON.stringify(publicValue);
    for (const token of ["correctKey", "PRIVATE_", "equivalenceKey", "novelAtPresentation", items(selected)[1]!.activity.prompt]) expect(json).not.toContain(token);
    expect(publicValue).toMatchObject({ totalSegments: 3, totalObjectives: 24, covered: false });
  });
  it("feedback is withheld until the entire segment is submitted, then reveals that segment only", () => {
    const selected = plan(context("final-test"));
    const responses = [0, 10].map((n) => ({ activityKey: items(selected)[n]!.activity.key, answer: { kind: "single_choice", optionKey: "no" },
      acceptedAt: new Date(now), score01: 0, explanation: `FEEDBACK_${n}`, commonError: "Revisar" }));
    expect(manifest(selected, { responses }).acceptedResponses[0]).toMatchObject({ score01: null, feedback: { explanation: "", commonError: "" } });
    const submitted = manifest(selected, { responses, submittedSegmentKeys: [selected.segments[0]!.key] });
    expect(submitted.activeActivity).toBeNull();
    expect(submitted.acceptedResponses).toHaveLength(1);
    expect(submitted.acceptedResponses[0]).toMatchObject({ score01: 0, feedback: { explanation: "FEEDBACK_0" } });
    expect(JSON.stringify(submitted)).not.toContain("FEEDBACK_10");
  });
  it("existing attempt projection hides reserved items in ordinary activity/review and defers assessment feedback", () => {
    const definition = fixture();
    const snapshot = prepareGuidedV2AttemptSnapshot(definition, versionId, { kind: "assessment", key: "final-test" })!;
    const responses = [{ activityKey: snapshot.orderedKeys[0]!, answer: { kind: "single_choice", optionKey: "yes" },
      acceptedAt: new Date(now), score01: 1, explanation: "PRIVATE_FEEDBACK", commonError: "" }];
    const base = { attemptId: versionId, enrollmentId: versionId, pathVersionId: versionId, rowVersion: 1,
      snapshot, resume: initialGuidedV2AttemptResume(), responses, status: "in_progress" as const };
    for (const purpose of ["activity", "review"] as const) {
      expect(guidedV2AttemptManifest({ ...base, purpose })).toMatchObject({ activeActivity: null, acceptedResponses: [] });
    }
    expect(guidedV2AttemptManifest({ ...base, purpose: "assessment" }).acceptedResponses[0]).toMatchObject({ score01: null, feedback: { explanation: "" } });
    expect(guidedV2AttemptManifest({ ...base, purpose: "assessment", status: "completed" }).acceptedResponses[0]).toMatchObject({ score01: 1, feedback: { explanation: "PRIVATE_FEEDBACK" } });
  });
  it("invalid segment or position cannot project a future item", () => {
    expect(() => manifest(undefined, { activeIndex: 11 })).toThrow();
    expect(() => manifest(undefined, { segmentKey: "foreign" })).toThrow();
    expect(() => manifest(undefined, { activeIndex: -1 })).toThrow();
  });
});
