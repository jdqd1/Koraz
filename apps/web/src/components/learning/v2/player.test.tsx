import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { V2HttpContracts } from "@cediah/contracts";
import { V2Player } from "./player";
import { playerFixture } from "./player-fixture";
import { fixtureId } from "./fixtures";
import { createV2PlayerClient, type PlayerAction, type PlayerTransportStore } from "./client";

function transportStore(): PlayerTransportStore {
  const values = new Map<string, string>();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); }, removeItem: key => { values.delete(key); } };
}
const f = playerFixture("single_choice");
const action: Extract<PlayerAction, { operation: "response" }> = { operation: "response", body: { activityKey: "practice-a", answer: { kind: "single_choice", optionKey: "b" }, confidence: null, expectedVersion: 1 } };
function responseReceipt() { return V2HttpContracts.attemptResponse.response.parse({ accepted: true, feedback: { explanation: "Explicación autorizada", commonError: "Error común", score01: 0 }, nextStep: null, attempt: { ...f.attempt, rowVersion: 2, activeActivity: null, acceptedResponses: [{ activityKey: "practice-a", answer: action.body.answer, serverAcceptedAt: "2026-10-03T12:00:00Z", score01: 0, feedback: { explanation: "Explicación autorizada", commonError: "Error común" } }] }, state: { ...f.state, rowVersion: 5 } }); }
describe("T029 transport and confirmed player rendering", () => {
  it("retains exact body/key across a lost response and page refresh", async () => {
    const store = transportStore(), fetcher = vi.fn().mockRejectedValueOnce(new Error("lost receipt")).mockResolvedValue(Response.json(responseReceipt()));
    const first = createV2PlayerClient(f.attempt.attemptId, fetcher, () => fixtureId(81), () => store);
    await expect(first.execute(action)).rejects.toThrow("lost receipt");
    const refreshed = createV2PlayerClient(f.attempt.attemptId, fetcher, () => fixtureId(82), () => store);
    expect(refreshed.pending()).toEqual(action);
    const confirmed = await refreshed.retry();
    expect(confirmed.operation).toBe("response"); expect(fetcher.mock.calls[0]).toEqual(fetcher.mock.calls[1]); expect(refreshed.pending()).toBeNull();
  });
  it("prevents changing an uncertain answer before confirmation", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("offline")), client = createV2PlayerClient(f.attempt.attemptId, fetcher, () => fixtureId(81), () => null);
    await expect(client.execute(action)).rejects.toThrow();
    await expect(client.execute({ ...action, body: { ...action.body, answer: { kind: "single_choice", optionKey: "a" } } })).rejects.toThrow("pendiente");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it.each([401, 403, 404, 409, 422, 429])("keeps server rejection %s separate from acceptance", async status => {
    const client = createV2PlayerClient(f.attempt.attemptId, vi.fn().mockResolvedValue(Response.json({ error: "rejected" }, { status })), () => fixtureId(81), () => null);
    await expect(client.execute(action)).rejects.toThrow(); expect(client.pending()).toBeNull();
  });
  it.each([500, 502, 503])("keeps %s uncertain with stable retry identity", async status => {
    const client = createV2PlayerClient(f.attempt.attemptId, vi.fn().mockResolvedValue(Response.json({ error: "uncertain" }, { status })), () => fixtureId(81), () => null);
    await expect(client.execute(action)).rejects.toThrow(); expect(client.pending()).toEqual(action);
  });
  it("does not accept malformed or foreign response receipts", async () => {
    for (const receipt of [{ ...responseReceipt(), solution: "private" }, { ...responseReceipt(), attempt: { ...responseReceipt().attempt, attemptId: fixtureId(77) } }, { ...responseReceipt(), state: { ...f.state, enrollmentId: fixtureId(78) } }]) {
      const client = createV2PlayerClient(f.attempt.attemptId, vi.fn().mockResolvedValue(Response.json(receipt)), () => fixtureId(81), () => null);
      await expect(client.execute(action)).rejects.toThrow(); expect(client.pending()).toEqual(action);
    }
  });
  it("requires the accepted answer and next step to match the server manifest", async () => {
    for (const receipt of [{ ...responseReceipt(), attempt: { ...responseReceipt().attempt, acceptedResponses: [] } },
      { ...responseReceipt(), nextStep: f.attempt.activeActivity }]) {
      const client = createV2PlayerClient(f.attempt.attemptId, vi.fn().mockResolvedValue(Response.json(receipt)), () => fixtureId(81), () => null);
      await expect(client.execute(action)).rejects.toThrow(); expect(client.pending()).toEqual(action);
    }
  });
  it("sends assistance to the help endpoint with CAS and accepts only its typed receipt", async () => {
    const receipt = V2HttpContracts.attemptHelp.response.parse({ help: { kind: "hint", text: "Pista autorizada" }, attempt: { ...f.attempt, rowVersion: 2 } });
    const fetcher = vi.fn().mockResolvedValue(Response.json(receipt));
    const result = await createV2PlayerClient(f.attempt.attemptId, fetcher, () => fixtureId(81), () => null).execute({ operation: "help", body: { activityKey: "practice-a", kind: "hint", expectedVersion: 1 } });
    expect(result).toMatchObject({ operation: "help", value: receipt }); expect(fetcher.mock.calls[0]![0].endsWith("/help")).toBe(true);
    expect(JSON.parse(fetcher.mock.calls[0]![1].body)).toEqual({ activityKey: "practice-a", kind: "hint", expectedVersion: 1 });
  });
  it("finishes with a server receipt and never invents a local completion", async () => {
    const receipt = V2HttpContracts.attemptComplete.response.parse({ attempt: { ...f.attempt, status: "completed", activeActivity: null, rowVersion: 3 }, state: f.state });
    const fetcher = vi.fn().mockResolvedValue(Response.json(receipt));
    expect(await createV2PlayerClient(f.attempt.attemptId, fetcher, () => fixtureId(81), () => null).execute({ operation: "complete", body: { expectedVersion: 2 } })).toMatchObject({ operation: "complete", value: receipt });
    expect(fetcher.mock.calls[0]![0].endsWith("/complete")).toBe(true);
  });
  it("falls back to in-memory retry when sessionStorage is unavailable", async () => {
    const store = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() { throw new Error("blocked"); } };
    const fetcher = vi.fn().mockRejectedValueOnce(new Error("offline")).mockImplementation(() => Promise.resolve(Response.json(responseReceipt())));
    const client = createV2PlayerClient(f.attempt.attemptId, fetcher, () => fixtureId(81), () => store);
    await expect(client.execute(action)).rejects.toThrow(); await client.retry(); expect(fetcher.mock.calls[0]).toEqual(fetcher.mock.calls[1]);
  });
  it.each(["study", "single_choice", "short_answer", "constructed_response"])("renders only public %s content and native controls", kind => {
    const fixture = playerFixture(kind), html = renderToString(<V2Player initialAttempt={fixture.attempt} initialState={fixture.state} />);
    expect(html).toContain(fixture.attempt.activeActivity!.prompt); expect(html).toContain('role="status"');
    for (const privateField of ["correctKey", "acceptedAnswers", "modelAnswer", "rubric", "EXPLICACION_FEEDBACK_PRIVADA"]) expect(html).not.toContain(privateField);
    if (kind === "study") expect(html).toContain("EXPLICACION_PREVIA"); else expect(html).not.toContain("EXPLICACION_PREVIA");
    if (kind === "constructed_response") { expect(html).not.toContain("Comparar con el modelo"); expect(html).not.toContain("Valora tu recuperación"); }
  });
  it("removes prior study and feedback from the recall DOM, including hidden HTML", () => {
    const attempt = { ...f.attempt, acceptedResponses: [{ activityKey: "study-a", answer: { kind: "study" as const, acknowledged: true as const }, serverAcceptedAt: "2026-10-03T12:00:00Z", score01: null, feedback: { explanation: "EXPLICACION_FEEDBACK_PRIVADA", commonError: "ERROR_ANTERIOR" } }] };
    const html = renderToString(<V2Player initialAttempt={attempt} initialState={f.state} />);
    expect(html).not.toContain("EXPLICACION_FEEDBACK_PRIVADA"); expect(html).not.toContain("ERROR_ANTERIOR");
  });
  it("resumes completed history with confirmed feedback without awarding mastery", () => {
    const attempt = { ...responseReceipt().attempt, status: "completed" as const };
    const html = renderToString(<V2Player initialAttempt={attempt} initialState={f.state} />);
    expect(html).toContain("Sesión completada"); expect(html).toContain("Explicación autorizada"); expect(html).toContain("Dominio por comprobar");
  });
  it("shows server partial feedback in resumed history while mastery remains pending", () => {
    const receipt=responseReceipt(),response=receipt.attempt.acceptedResponses[0]!;
    const attempt={...receipt.attempt,status:"completed" as const,acceptedResponses:[{...response,score01:0,feedback:{...response.feedback,partialScore01:.75}}]};
    const html=renderToString(<V2Player initialAttempt={attempt} initialState={f.state} />);
    expect(html).toContain("Acierto parcial:");expect(html).toContain("75");expect(html).toContain("Aún falta una respuesta completamente correcta.");expect(html).toContain("Dominio por comprobar");
  });
  it("resumes submitted and revealed constructed stages only from the server manifest", () => {
    const fixture = playerFixture("constructed_response");
    const submitted = { activityKey: "practice-a", text: "TEXTO_PROPIO_PERSISTIDO", stage: "submitted" as const };
    const before = renderToString(<V2Player initialAttempt={{ ...fixture.attempt, constructedResponse: submitted }} initialState={fixture.state} />);
    expect(before).toContain("TEXTO_PROPIO_PERSISTIDO"); expect(before).toContain("Comparar con el modelo");
    expect(before).not.toContain("MODELO_AUTORIZADO"); expect(before).not.toContain("CRITERIO_AUTORIZADO"); expect(before).not.toContain("<textarea");
    const after = renderToString(<V2Player initialAttempt={{ ...fixture.attempt, constructedResponse: { ...submitted, stage: "revealed", modelAnswer: "MODELO_AUTORIZADO", rubric: [{ key: "reason", criterion: "CRITERIO_AUTORIZADO", example: "EJEMPLO_AUTORIZADO" }] } }} initialState={fixture.state} />);
    for (const text of ["TEXTO_PROPIO_PERSISTIDO", "MODELO_AUTORIZADO", "CRITERIO_AUTORIZADO", "EJEMPLO_AUTORIZADO", "Lo recuperé"]) expect(after).toContain(text);
    expect(after).not.toContain("Comparar con el modelo");
  });
  it("restores feedback provenance in confirmed history and keeps it out of the next recall DOM", () => {
    const attempt = { ...responseReceipt().attempt, acceptedResponses: [{ ...responseReceipt().attempt.acceptedResponses[0]!, feedback: { explanation: "Explicación autorizada", commonError: "", sources: [{ key: "source", title: "Fuente fijada", citation: "CITA_AUTORIZADA", locator: { heading: "Relación", sectionPath: ["Capítulo"], page: 2 }, excerpt: "FRAGMENTO_AUTORIZADO", url: "https://example.test/reference" }] } }] };
    const complete = renderToString(<V2Player initialAttempt={{ ...attempt, status: "completed" }} initialState={f.state} />);
    for (const text of ["Fuente fijada", "CITA_AUTORIZADA", "FRAGMENTO_AUTORIZADO", "Página 2"]) expect(complete).toContain(text);
    const recall = renderToString(<V2Player initialAttempt={{ ...attempt, activeActivity: f.attempt.activeActivity }} initialState={f.state} />);
    expect(recall).not.toContain("FRAGMENTO_AUTORIZADO"); expect(recall).not.toContain("CITA_AUTORIZADA");
  });
});
