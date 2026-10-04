import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RoutePackageSchema, toV2PublicActivity, validateRoutePackage, type RouteActivity } from "@cediah/contracts";
import { activityDeletionBlockV2, activitySaveIssuesV2, activityValidationV2, addActivityV2, choiceCorrectV2, deleteActivityV2, objectiveVerificationOptionsV2, replaceActivityV2, type ActivityPresetV2 } from "./activity-model";
import { ActivityEditorV2 } from "./activity-editor";
import { createEditorV2State, draftFromRouteV2 } from "./editor-model";
import { serializeEditorV2 } from "./editor-serialization";
import { editorV2FixturePackage, editorV2FixtureRoute } from "./editor-fixtures";

export function completedActivityV2(activity: RouteActivity): RouteActivity {
  const base = { ...activity, prompt: `Consigna ${activity.key}`, feedback: { ...activity.feedback, explanation: "Por qué corresponde esta respuesta", commonError: "Confundir los ejemplos" } };
  switch (base.kind) {
    case "study": return { ...base, payload: { ...base.payload, body: "Una explicación que no se convierte en respuesta", focusSpans: [{ start: 0, end: 3 }] } };
    case "single_choice": return { ...base, payload: { ...base.payload, options: base.payload.options.map((option, index) => ({ ...option, text: index === 0 ? "Ejemplo correcto" : "Ejemplo incorrecto" })), distractorFeedback: Object.fromEntries(base.payload.options.filter((option) => option.key !== base.payload.correctKey).map((option) => [option.key, "El contraste explica el error"])) } };
    case "short_answer": return { ...base, payload: { ...base.payload, acceptedAnswers: ["sí", "no es igual", "5 mm"], modelAnswer: "sí" } };
    case "constructed_response": return { ...base, payload: { ...base.payload, modelAnswer: "Modelo privado", rubric: [{ key: "criterio-1", criterion: "Explicar la relación", example: "Comparar ambos ejemplos" }], verificationActivityKey: "choice" } };
    default: return base;
  }
}
describe("T025 activity creation and portable round-trip", () => {
  it.each(["study", "single_choice", "short_answer", "constructed_response", "card"] as ActivityPresetV2[])("creates %s without losing imported families or adding contract fields", (preset) => {
    const before = editorV2FixtureRoute();
    const pkg = addActivityV2(before.definition, preset, "objective");
    const created = pkg.activities.at(-1)!;
    expect(created.prompt).toBe("");
    expect(pkg.units[0]!.activityKeys).toContain(created.key);
    expect(pkg.activities.slice(0, -1)).toEqual(before.definition.activities);
    const completed = replaceActivityV2(pkg, completedActivityV2(created));
    const state = createEditorV2State({ route: before }); state.draft.package = completed;
    const serialized = serializeEditorV2(state);
    expect(serialized.ok).toBe(true);
    if (!serialized.ok) throw new Error(JSON.stringify(serialized.issues));
    const wire = JSON.parse(JSON.stringify(serialized.body));
    expect(RoutePackageSchema.parse(wire.package)).toEqual(completed);
    expect(wire.package.activities.at(-1).kind).toBe(preset === "card" ? "constructed_response" : preset);
    expect(wire).not.toHaveProperty("approvedBy");
    expect(before.definition.activities).toHaveLength(8);
  });
  it("preserves incomplete local input and reports missing fields instead of fabricating content", () => {
    const route = editorV2FixtureRoute();
    const state = createEditorV2State({ route });
    state.draft.package = addActivityV2(route.definition, "short_answer", "objective");
    const result = serializeEditorV2(state);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues).toContainEqual(expect.objectContaining({ path: "package.activities.8.payload.acceptedAnswers.0" }));
    expect(state.draft.package.activities.at(-1)!.prompt).toBe("");
    expect(addActivityV2(route.definition, "study", "missing")).toBe(route.definition);
  });
  it("keeps activities in the new objective's unit while preserving other activity membership", () => {
    const pkg = editorV2FixturePackage();
    pkg.units.push({ ...pkg.units[0]!, key: "other-unit", objectiveKeys: ["other"], activityKeys: [] });
    pkg.objectives.push({ ...pkg.objectives[0]!, key: "other", unitKey: "other-unit" });
    const before = pkg.units[0]!.activityKeys;
    const next = replaceActivityV2(pkg, { ...pkg.activities[0]!, objectiveKey: "other" });
    expect(next.units[0]!.activityKeys).toEqual(before.filter((key) => key !== "study"));
    expect(next.units[1]!.activityKeys).toEqual(["study"]);
    expect(pkg.units[0]!.activityKeys).toEqual(before);
  });
});
describe("T025 feedback, objective verification and private solutions", () => {
  it("changing the correct option requires feedback for the formerly correct one and keeps remaining distractors", () => {
    const pkg = editorV2FixturePackage(); const choice = pkg.activities.find((item) => item.kind === "single_choice")!;
    const next = choiceCorrectV2(choice, "b");
    expect(next.payload.distractorFeedback).toEqual({ a: "" });
    expect(next.payload.correctKey).toBe("b");
    expect(choice.payload.distractorFeedback).toEqual({ b: "Explicación" });
    expect(validateRoutePackage(replaceActivityV2(pkg, next)).valid).toBe(false);
    expect(choiceCorrectV2(choice, "missing")).toBe(choice);
  });
  it("uses the shared validator to identify missing distractor explanation and source feedback by objective", () => {
    const pkg = editorV2FixturePackage(); const choice = pkg.activities.find((item) => item.kind === "single_choice")!;
    choice.payload.distractorFeedback = {};
    const invalid = activityValidationV2(pkg);
    expect(invalid.objectives[0]!.issues).toContainEqual(expect.objectContaining({ path: "/activities/1/payload/distractorFeedback" }));
    expect(activitySaveIssuesV2(pkg)).toContainEqual(expect.objectContaining({ path: "/activities/1/payload/distractorFeedback" }));
    choice.payload.distractorFeedback = { b: "El error se explica" }; choice.feedback.sourceKeys = [];
    expect(activityValidationV2(pkg).objectives[0]!.issues).toContainEqual(expect.objectContaining({ path: "/activities/1/feedback/sourceKeys" }));
    expect(activitySaveIssuesV2(pkg)).toEqual([]); // A publication-only source gap can remain in a saved draft.
  });
  it("offers only objective checks in learning or gate, on the same objective, excluding reserves and self-report", () => {
    const pkg = editorV2FixturePackage(); const constructed = pkg.activities.find((item) => item.kind === "constructed_response")!;
    const choice = pkg.activities.find((item) => item.kind === "single_choice")!;
    pkg.activities.push({ ...choice, key: "reserved", use: "final" }, { ...choice, key: "diagnostic-only", use: "diagnostic" }, { ...choice, key: "different", objectiveKey: "other" });
    const keys = objectiveVerificationOptionsV2(pkg, constructed).map((item) => item.key);
    expect(keys).toContain("choice"); expect(keys).not.toContain("reserved"); expect(keys).not.toContain("diagnostic-only"); expect(keys).not.toContain("different"); expect(keys).not.toContain("constructed"); expect(keys).not.toContain("study");
    const image = pkg.activities.find((item) => item.kind === "image_target")!;
    image.payload.masking = "all_labels";
    expect(objectiveVerificationOptionsV2(pkg, constructed).map((item) => item.key)).not.toContain(image.key);
    image.payload.masking = "no_labels";
    expect(objectiveVerificationOptionsV2(pkg, constructed).map((item) => item.key)).toContain(image.key);
    constructed.payload.verificationActivityKey = null;
    expect(activityValidationV2(pkg).issues).toContainEqual(expect.objectContaining({ path: "/activities/3/payload/verificationActivityKey" }));
  });
  it("does not put correct answers, aliases, model or rubric into public activity DTOs", () => {
    const pkg = editorV2FixturePackage();
    for (const activity of pkg.activities.filter((item) => ["single_choice", "short_answer", "constructed_response"].includes(item.kind))) {
      const dto = JSON.stringify(toV2PublicActivity(activity));
      expect(dto).not.toMatch(/correctKey|distractorFeedback|acceptedAnswers|modelAnswer|rubric|verificationActivityKey/);
    }
  });
  it("blocks deletion used by a case, verification or assessment and safely removes an unlinked activity", () => {
    const pkg = editorV2FixturePackage(); expect(activityDeletionBlockV2(pkg, "choice")).not.toBeNull(); expect(deleteActivityV2(pkg, "choice")).toBe(pkg);
    pkg.assessments[0]!.candidateActivityKeys = ["study"]; expect(activityDeletionBlockV2(pkg, "study")).toContain("evaluación");
    const added = addActivityV2(pkg, "study", "objective"); const key = added.activities.at(-1)!.key;
    const deleted = deleteActivityV2(added, key); expect(deleted.activities).toEqual(pkg.activities); expect(deleted.units[0]!.activityKeys).not.toContain(key);
  });
  it("renders all four editors, a separate editorial disclosure and explicit formative card wording", () => {
    const html = renderToStaticMarkup(<ActivityEditorV2 draft={draftFromRouteV2(editorV2FixtureRoute())} disabled={false} onChange={() => {}} />);
    for (const label of ["Estudio", "Elección única", "Respuesta breve", "Respuesta construida", "Tarjeta de recuperación", "Solución y feedback · solo edición", "Contenido de estudio", "Opción correcta", "Respuesta aceptada 1", "Verificación objetiva del mismo objetivo", "Fuentes del feedback y de los distractores", "Validación por objetivo", "la autoevaluación es formativa y no acredita dominio"]) expect(html).toContain(label);
    expect(html).not.toContain('placeholder="UUID');
    expect(html).not.toContain('value="guided-v2.0"');
    expect(html).toContain('disabled=""'); // choice is referenced by the imported case/verification.
  });
});
