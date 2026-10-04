import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RoutePackageSchema, toV2PublicActivity, validateRoutePackage, type RouteActivity } from "@cediah/contracts";
import { addActivityV2, activitySaveIssuesV2, replaceActivityV2, activityDeletionBlockV2 } from "./activity-model";
import { addVisualPresetV2, moveEntryV2, type VisualPresetV2 } from "./visual-presets";
import { caseChildrenV2 } from "./case-fields";
import { imagePointV2 } from "./visual-geometry";
import { ActivityEditorV2 } from "./activity-editor";
import { createEditorV2State, draftFromRouteV2 } from "./editor-model";
import { serializeEditorV2 } from "./editor-serialization";
import { editorV2FixturePackage, editorV2FixtureRoute } from "./editor-fixtures";

function complete(activity: RouteActivity): RouteActivity {
  const base = { ...activity, prompt: `Ejemplo ${activity.key}`, feedback: { ...activity.feedback, explanation: "Explicación sintética" } };
  switch (base.kind) {
    case "match": return { ...base, payload: { ...base.payload, prompts: [{ key: "p1", text: "Contraste A" }, { key: "p2", text: "Contraste B" }], choices: [{ key: "c1", text: "Relación A" }, { key: "c2", text: "Relación B" }], correctByPrompt: { p1: "c2", p2: "c1" }, edges: base.payload.presentation === "causal_map" ? [{ from: "p1", to: "c2", label: "produce" }] : [] } };
    case "sequence": return { ...base, payload: { ...base.payload, items: base.payload.items.map((item, i) => ({ ...item, text: `Paso ${i + 1}` })), acceptedOrders: [base.payload.items.map((item) => item.key).reverse(), base.payload.items.map((item) => item.key)] } };
    case "image_target": return { ...base, payload: { ...base.payload, assetKey: "image", accessibleAlternativeKey: "match", mode: "labeling", targets: [{ key: "zone", prompt: "Identifica", polygon: [{ x: .125, y: .15 }, { x: .625, y: .15 }, { x: .3, y: .675 }], label: "Solución privada" }], labels: [{ key: "label", text: "Opción A" }], correctLabelByTarget: { zone: "label" } } };
    case "case": return { ...base, payload: { stages: base.payload.stages.map((stage, i) => ({ ...stage, narrative: `Narrativa ${i + 1}`, childActivityKey: stage.childActivityKey || (i === 0 ? "match" : "sequence") })) } };
    case "constructed_response": return { ...base, payload: { ...base.payload, modelAnswer: "Modelo sintético", rubric: [{ key: "criterion", criterion: "Relacionar", example: "Relación sintética" }] } };
    case "single_choice": return { ...base, payload: { ...base.payload, options: base.payload.options.map((item, i) => ({ ...item, text: `Opción ${i + 1}` })), distractorFeedback: { "opcion-2": "Explica el error" } } };
    default: return base;
  }
}

describe("T026 complete builder and composition round-trip", () => {
  it.each(["match", "image_target", "sequence", "case", "comparison", "causal_map", "mechanism", "error"] as VisualPresetV2[])("creates and serializes %s with stable geometry, order and references", (preset) => {
    const route = editorV2FixtureRoute(); const before = structuredClone(route.definition);
    let pkg = addActivityV2(route.definition, preset, "objective");
    const added = pkg.activities.slice(before.activities.length);
    for (const item of added) pkg = replaceActivityV2(pkg, complete(item));
    const state = createEditorV2State({ route }); state.draft.package = pkg;
    const saved = serializeEditorV2(state);
    expect(saved.ok).toBe(true); if (!saved.ok) throw Error(JSON.stringify(saved.issues));
    expect(RoutePackageSchema.parse(JSON.parse(JSON.stringify(saved.body)).package)).toEqual(pkg);
    expect(activitySaveIssuesV2(pkg)).toEqual([]);
    expect(new Set(pkg.activities.map((item) => item.key)).size).toBe(pkg.activities.length);
    expect(new Set(pkg.units[0]!.activityKeys).size).toBe(pkg.units[0]!.activityKeys.length);
    expect(pkg.activities.slice(0, before.activities.length)).toEqual(before.activities);
    expect(route.definition).toEqual(before);
    if (preset === "mechanism") {
      expect(added.map((item) => item.kind)).toEqual(["sequence", "constructed_response"]);
      const seq = pkg.activities.find((item) => item.key === added[0]!.key)!;
      expect(seq.kind === "sequence" && seq.payload.whyActivityKey).toBe(added[1]!.key);
    }
    if (preset === "error") {
      expect(added.map((item) => item.kind)).toEqual(["case", "single_choice", "constructed_response"]);
      const wrapper = pkg.activities.find((item) => item.key === added[0]!.key)!;
      expect(wrapper.kind === "case" && wrapper.payload.stages.map((stage) => stage.childActivityKey)).toEqual(added.slice(1).map((item) => item.key));
      expect(pkg.units[0]!.activityKeys.slice(-3)).toEqual(added.map((item) => item.key));
    }
  });
  it("does not invent content, asset keys or case children; incomplete fields remain recoverable", () => {
    const before = editorV2FixturePackage();
    for (const kind of ["image_target", "case", "mechanism", "error"] as const) {
      const next = addVisualPresetV2(before, kind, "objective");
      expect(next.activities.slice(8).every((item) => item.prompt === "" && item.feedback.explanation === "")).toBe(true);
      expect(activitySaveIssuesV2(next).length).toBeGreaterThan(0);
    }
    expect(addVisualPresetV2(before, "match", "absent")).toBe(before);
    const full = { ...before, activities: Array.from({length:1999}, () => before.activities[0]!) };
    expect(addVisualPresetV2(full, "error", "objective")).toBe(full);
  });
  it("reorders case children exactly once in the same unit, without copying activities", () => {
    const pkg = editorV2FixturePackage(); const wrapper = pkg.activities.find((item) => item.kind === "case")!;
    const next = replaceActivityV2(pkg, { ...wrapper, payload: { stages: moveEntryV2(wrapper.payload.stages, 0, 1) } });
    expect(next.activities).toHaveLength(pkg.activities.length);
    expect(next.units[0]!.activityKeys.slice(-3)).toEqual(["case", "short", "choice"]);
    expect(next.units[0]!.activityKeys.filter((key) => key === "choice")).toHaveLength(1);
    expect(validateRoutePackage(next).issues.filter((issue) => issue.path.includes("/stages") && issue.message.includes("secuencia"))).toEqual([]);
    expect(activityDeletionBlockV2(next, "choice")).toContain("Otra actividad");
    expect(moveEntryV2(["a", "b"], 0, -1)).toEqual(["a", "b"]);
  });
  it("excludes nested, shared, reserved, wrong-objective and self children from case selectors", () => {
    const pkg = editorV2FixturePackage(); const wrapper = pkg.activities.find((item) => item.kind === "case")!;
    pkg.assessments[0]!.candidateActivityKeys = ["sequence"];
    pkg.activities.push({ ...pkg.activities[0]!, key: "other", objectiveKey: "other-objective" });
    const keys = caseChildrenV2(pkg, wrapper, "first").map((item) => item.key);
    expect(keys).toContain("choice"); expect(keys).not.toContain("short"); expect(keys).not.toContain("case"); expect(keys).not.toContain("sequence"); expect(keys).not.toContain("other");
    pkg.activities.push({ ...wrapper, key: "another-case", payload: { stages: [{ key:"a", narrative:"A", childActivityKey:"match" }, { key:"b", narrative:"B", childActivityKey:"image" }] } });
    expect(caseChildrenV2(pkg, wrapper, "first").map((item) => item.key)).not.toContain("match");
  });
});

describe("T026 geometry, invalid mappings and public privacy", () => {
  it.each([
    [{x:0,y:0},{x:1,y:1},{x:0,y:1},{x:1,y:0}],
    [{x:0,y:0},{x:.5,y:.5},{x:1,y:1}],
    [{x:0,y:0},{x:0,y:0},{x:1,y:0}],
    [{x:-.1,y:0},{x:1,y:0},{x:0,y:1}],
  ])("blocks saving invalid geometry instead of silently repairing it: %j", (...polygon) => {
    const pkg = editorV2FixturePackage(); const image = pkg.activities.find((item) => item.kind === "image_target")!;
    image.payload.targets[0]!.polygon = polygon;
    expect(activitySaveIssuesV2(pkg).length).toBeGreaterThan(0);
  });
  it("uses contain rectangle at zoom, in landscape and portrait; excludes bands and includes border", () => {
    const box = {left:100, top:50, width:400, height:400};
    expect(imagePointV2({x:300,y:250}, box, {width:800,height:400})).toEqual({x:.5,y:.5});
    expect(imagePointV2({x:300,y:60}, box, {width:800,height:400})).toBeNull();
    expect(imagePointV2({x:100,y:150}, box, {width:800,height:400})).toEqual({x:0,y:0});
    expect(imagePointV2({x:120,y:250}, box, {width:400,height:800})).toBeNull();
    expect(imagePointV2({x:600,y:500}, {left:200,top:100,width:800,height:800}, {width:800,height:400})).toEqual({x:.5,y:.5});
    expect(imagePointV2({x:0,y:0}, {...box,width:0}, {width:1,height:1})).toBeNull();
  });
  it("rejects duplicate orders and incomplete match/label mappings with field paths", () => {
    const pkg = editorV2FixturePackage();
    const seq = pkg.activities.find((item) => item.kind === "sequence")!; seq.payload.acceptedOrders = [["one", "one", "three"]];
    const match = pkg.activities.find((item) => item.kind === "match")!; match.payload.correctByPrompt = {};
    const image = pkg.activities.find((item) => item.kind === "image_target")!; image.payload.mode = "labeling";
    expect(activitySaveIssuesV2(pkg).map((issue) => issue.path)).toEqual(expect.arrayContaining(["/activities/4/payload/correctByPrompt", "/activities/5/payload/correctLabelByTarget", "/activities/6/payload/acceptedOrders"]));
  });
  it("keeps solutions, geometry, edges, mappings and future case stages out of public DTOs", () => {
    const pkg = editorV2FixturePackage();
    for (const item of pkg.activities.filter((item) => ["match", "image_target", "sequence"].includes(item.kind))) {
      const publicItem = toV2PublicActivity(complete(item));
      const json = JSON.stringify(publicItem);
      for (const key of ["correctByPrompt", "correctLabelByTarget", "polygon", "acceptedOrders", "edges", "Solución privada"]) expect(json).not.toContain(key);
    }
    const wrapper = pkg.activities.find((item) => item.kind === "case")!;
    expect(JSON.stringify(toV2PublicActivity(wrapper, 0))).not.toContain("Etapa 2");
  });
  it("renders all eight kinds, composition presets and keyboard alternatives in the existing shell", () => {
    const html = renderToStaticMarkup(<ActivityEditorV2 draft={draftFromRouteV2(editorV2FixtureRoute())} disabled={false} onChange={() => {}} />);
    for (const label of ["Tabla de comparación", "Micro-mapa de relaciones", "Mecanismo y explicación", "Detección y corrección de errores", "Tabla de correspondencias", "Añadir punto por coordenadas", "Subir etapa 2", "Subir paso 2 del orden 1", "Sin etiquetas", "Alternativa accesible de texto o tabla"]) expect(html).toContain(label);
    expect(html).not.toContain("Su formulario corresponde a la siguiente ficha");
    expect(html).toContain("solo edición");
    const image = complete(editorV2FixturePackage().activities.find((item) => item.kind === "image_target")!);
    const next = replaceActivityV2(editorV2FixturePackage(), image);
    const markup = renderToStaticMarkup(<ActivityEditorV2 draft={{...draftFromRouteV2(editorV2FixtureRoute()),package:next}} disabled={false} onChange={() => {}} />);
    expect(markup).not.toContain('alt="Solución privada"');
  });
});
