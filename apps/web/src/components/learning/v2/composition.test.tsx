import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import type { V2AttemptManifest, V2PublicActivity } from "@cediah/contracts";
import { ActivityComposition, SequenceRecap } from "./composition";
import { moveSequenceItem, validSequenceOrder } from "./renderers/sequence";
import { V2Player } from "./player";
import { playerFixture } from "./player-fixture";

const fixture = playerFixture("single_choice");
const sequence: Extract<V2PublicActivity, { kind: "sequence" }> = { ...fixture.attempt.activeActivity!, kind: "sequence", payload: { items: [{ key: "c", text: "Resultado" }, { key: "a", text: "Origen" }, { key: "b", text: "Cambio" }] } };
const noop = () => {};
const props = { attemptId: fixture.attempt.attemptId, rowVersion: 1, disabled: false, comparison: null, onSubmit: noop, onReveal: noop, onAlternative: noop };

describe("T031 sequences and existing-kind compositions", () => {
  it("permits adjacent movements while preserving every item and ignores boundaries", () => {
    const initial = ["c", "a", "b"];
    const first = moveSequenceItem(initial, "a", -1);
    expect(first).toEqual(["a", "c", "b"]);
    expect(moveSequenceItem(first, "b", -1)).toEqual(["a", "b", "c"]);
    expect(initial).toEqual(["c", "a", "b"]);
    for (const [key, offset] of [["c", -1], ["b", 1], ["missing", 1]] as const) expect(moveSequenceItem(initial, key, offset)).toEqual(initial);
    for (const key of initial) for (const offset of [-1, 1] as const) expect(validSequenceOrder(sequence.payload.items, moveSequenceItem(initial, key, offset))).toBe(true);
  });
  it("rejects missing, repeated, foreign or invalid-size item sets without grading an order", () => {
    for (const order of [["a", "a", "b"], ["a", "b"], ["a", "b", "foreign"]]) expect(validSequenceOrder(sequence.payload.items, order)).toBe(false);
    expect(validSequenceOrder([sequence.payload.items[0]!], ["c"])).toBe(false);
    expect(validSequenceOrder([...sequence.payload.items, sequence.payload.items[0]!], ["c", "a", "b", "c"])).toBe(false);
    expect(validSequenceOrder(sequence.payload.items, ["b", "a", "c"])).toBe(true);
  });
  it("mounts sequence in the actual player and disables the entire response during pending", () => {
    const html = renderToString(<V2Player initialAttempt={{ ...fixture.attempt, activeActivity: sequence }} initialState={fixture.state} />);
    expect(html).toContain("Comprobar secuencia"); expect(html).toContain("Subir: Cambio"); expect(html).not.toContain("acceptedOrders");
    const disabled = renderToString(<ActivityComposition {...props} disabled activity={sequence} />);
    expect(disabled).toContain('<fieldset disabled=""'); expect(disabled).toContain('type="submit" class="learning-primary-button" disabled=""');
  });
  it("recaps only the server accepted order with public labels, without local correctness", () => {
    const response: V2AttemptManifest["acceptedResponses"][number] = { activityKey: sequence.key, answer: { kind: "sequence", orderedKeys: ["a", "b", "c"] }, serverAcceptedAt: "2026-10-03T12:00:00Z", score01: 0, feedback: { explanation: "", commonError: "" } };
    const html = renderToString(<SequenceRecap response={response} activity={sequence} />);
    expect(html.indexOf("Origen")).toBeLessThan(html.indexOf("Cambio")); expect(html.indexOf("Cambio")).toBeLessThan(html.indexOf("Resultado"));
    expect(html).not.toContain("correcta");
    const restored = renderToString(<SequenceRecap response={response} />);
    expect(restored).toContain("pasos guardado"); expect(restored).not.toContain("<li>a</li>");
  });
  it("shows the current authorized case child without a wrapper response or future-stage controls", () => {
    const activity = { ...sequence, representation: "case" as const, prompt: "NARRATIVA_ACTUAL\n\nOrdena estos cambios" };
    const html = renderToString(<V2Player initialAttempt={{ ...fixture.attempt, activeActivity: activity }} initialState={fixture.state} />);
    expect(html).toContain("NARRATIVA_ACTUAL"); expect(html).toContain("Paso del caso progresivo"); expect(html).toContain("Comprobar secuencia");
    for (const text of ["Siguiente etapa", "NARRATIVA_FUTURA", "acceptedOrders", "stages", "Puntuar caso"]) expect(html).not.toContain(text);
  });
  it("does not fabricate a child or permit skipping when given only a public wrapper", () => {
    const activity: V2PublicActivity = { ...sequence, kind: "case", payload: { activeStage: { key: "stage-a", narrative: "Solo etapa autorizada", childActivityKey: "child-a" } } };
    const html = renderToString(<ActivityComposition {...props} activity={activity} />);
    expect(html).toContain("Solo etapa autorizada"); expect(html).toContain("Recarga para continuar"); expect(html).not.toContain("<button");
  });
  it.each(["worked_example", "partial_example"] as const)("keeps %s study separate from independent recall", scaffold => {
    const study = playerFixture("study").attempt.activeActivity!;
    if (study.kind !== "study") throw new Error("study fixture");
    const html = renderToString(<ActivityComposition {...props} activity={{ ...study, payload: { ...study.payload, scaffold } }} />);
    expect(html).toContain(scaffold === "worked_example" ? "Ejemplo resuelto" : "Ejemplo con apoyo parcial"); expect(html).toContain("otro paso");
    const next = renderToString(<ActivityComposition {...props} activity={sequence} />);
    expect(next).not.toContain("EXPLICACION_PREVIA"); expect(next).not.toContain("Ejemplo resuelto");
  });
  it.each(["single_choice", "short_answer", "constructed_response"])("reuses %s for prediction, error or causal explanation without private models", kind => {
    const activity = { ...playerFixture(kind).attempt.activeActivity!, representation: "case" as const };
    const html = renderToString(<ActivityComposition {...props} activity={activity} />);
    expect(html).toContain("Paso del caso progresivo"); expect(html).not.toContain("modelAnswer"); expect(html).not.toContain("correctKey"); expect(html).not.toContain("acceptedAnswers");
  });
  it.each(["comparison_table", "causal_map"] as const)("renders %s using the existing matching controls", presentation => {
    const activity: V2PublicActivity = { ...sequence, kind: "match", representation: "table", payload: { presentation, prompts: [{ key: "p", text: "Concepto" }], choices: [{ key: "q", text: "Relación" }], allowReuse: true } };
    const html = renderToString(<ActivityComposition {...props} activity={activity} />);
    expect(html).toContain("<select"); expect(html).toContain("Comprobar relaciones"); expect(html).not.toContain("correctByPrompt");
  });
});
