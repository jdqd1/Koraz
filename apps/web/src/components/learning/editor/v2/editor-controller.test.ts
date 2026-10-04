import { describe, expect, it, vi } from "vitest";
import { createEditorV2State, draftFromRouteV2 } from "./editor-model";
import { createEditorV2Controller } from "./editor-controller";
import { createEditorV2Api } from "./editor-api";
import { editorV2FixtureRoute, fixtureV2Id } from "./editor-fixtures";

function workspace() {
  let route = editorV2FixtureRoute();
  const storage = new Map<string, string>();
  const requests: Array<{ path: string; init?: RequestInit }> = [];
  const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    requests.push({ path: String(url), init });
    if (init?.method === "PATCH") {
      const body = JSON.parse(String(init.body));
      if (body.expectedVersion !== route.editVersion) return Response.json({ error: "version_conflict" }, { status: 409 });
      route = { ...route, definition: body.package, bindings: body.bindings, editVersion: route.editVersion + 1, reviewedContentHash: null, approvedBy: null };
    }
    return Response.json({ route });
  });
  const controller = createEditorV2Controller({ state: createEditorV2State({ route }), actorUserId: fixtureV2Id(1), api: createEditorV2Api(fetcher as typeof fetch),
    createKey: () => fixtureV2Id(100), now: () => 1000, storage: { setItem: (k, v) => { storage.set(k, v); }, removeItem: (k) => { storage.delete(k); } } });
  return { controller, fetcher, requests, storage, remote: () => route, advance: () => { route = { ...route, editVersion: route.editVersion + 1 }; } };
}
function edit(w: ReturnType<typeof workspace>, title = "Cambio local") {
  const draft = structuredClone(w.controller.getSnapshot().draft);
  draft.package.route.title = title;
  w.controller.edit(draft);
}
describe("T023 confirmed save and recovery", () => {
  it("edit → save → reload retains every v2 field and clears recovery only after confirmation", async () => {
    const w = workspace(); edit(w);
    const draft = structuredClone(w.controller.getSnapshot().draft);
    expect(w.storage.size).toBe(1);
    expect(await w.controller.save()).toBe(true);
    expect(w.storage.size).toBe(0);
    const reload = createEditorV2State({ route: w.remote() });
    expect(reload.draft).toEqual(draft);
    expect(reload.confirmed?.editVersion).toBe(2);
    expect(w.requests[0]?.init?.headers).toMatchObject({ "Idempotency-Key": fixtureV2Id(100) });
    expect(w.requests[0]?.init?.cache).toBe("no-store");
  });
  it("409 keeps the full local copy and CAS base, disables retry and waits for explicit reload", async () => {
    const w = workspace(); edit(w); w.advance();
    const draft = structuredClone(w.controller.getSnapshot().draft);
    expect(await w.controller.save()).toBe(false);
    expect(w.controller.getSnapshot()).toMatchObject({ conflict: true, dirty: true, confirmed: { editVersion: 1 }, draft });
    expect(w.storage.size).toBe(1);
    expect(await w.controller.save()).toBe(false);
    expect(w.requests).toHaveLength(1);
    expect(await w.controller.openSavedVersion()).toBe(true);
    expect(w.controller.getSnapshot()).toMatchObject({ conflict: false, dirty: false, confirmed: { editVersion: 2 } });
  });
  it("retries an uncertain response with the identical body and key even after local recovery", async () => {
    const w = workspace(); edit(w);
    w.fetcher.mockRejectedValueOnce(new Error("Disconnected"));
    expect(await w.controller.save()).toBe(false);
    const recovery = w.controller.recovery();
    const reloaded = createEditorV2Controller({ state: createEditorV2State({ route: w.remote() }), actorUserId: fixtureV2Id(1), api: createEditorV2Api(w.fetcher as typeof fetch), createKey: () => fixtureV2Id(999) });
    expect(reloaded.recover(recovery)).toBe(true);
    expect(await reloaded.save()).toBe(true);
    expect(w.fetcher.mock.calls[1]?.[1]?.headers).toEqual(w.fetcher.mock.calls[0]?.[1]?.headers);
    expect(w.fetcher.mock.calls[1]?.[1]?.body).toEqual(w.fetcher.mock.calls[0]?.[1]?.body);
  });
  it("locks simultaneous saves and edits until the confirmed result", async () => {
    const w = workspace(); edit(w);
    let resolve!: (value: Response) => void;
    w.fetcher.mockImplementationOnce(() => new Promise<Response>((r) => { resolve = r; }));
    const first = w.controller.save();
    expect(await w.controller.save()).toBe(false);
    edit(w, "No autorizado durante guardado");
    expect(w.controller.getSnapshot().draft.package.route.title).toBe("Cambio local");
    resolve(Response.json({ route: { ...w.remote(), editVersion: 2 } }));
    expect(await first).toBe(true);
    expect(w.fetcher).toHaveBeenCalledTimes(1);
  });
  it("does not repeat POST if creation was accepted but the follow-up GET failed", async () => {
    const route = editorV2FixtureRoute();
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ pathId: route.pathId, pathVersionId: route.pathVersionId, editVersion: 1, status: "draft" }))
      .mockRejectedValueOnce(new Error("Disconnected"))
      .mockResolvedValueOnce(Response.json({ route }));
    const c = createEditorV2Controller({ state: createEditorV2State({ draft: draftFromRouteV2(route) }), actorUserId: fixtureV2Id(1), api: createEditorV2Api(fetcher), createKey: () => fixtureV2Id(100) });
    expect(await c.save()).toBe(false);
    expect(c.canEdit()).toBe(false);
    const recovery = c.recovery();
    expect(recovery.pending?.createdPathId).toBe(route.pathId);
    expect(await c.save()).toBe(true);
    expect(fetcher.mock.calls.map((call) => call[1].method)).toEqual(["POST", "GET", "GET"]);
  });
  it("failed or mismatched reads never overwrite the local conflict copy", async () => {
    const w = workspace(); edit(w); w.advance(); await w.controller.save();
    w.fetcher.mockResolvedValueOnce(Response.json({ route: { ...w.remote(), pathId: fixtureV2Id(999) } }));
    expect(await w.controller.openSavedVersion()).toBe(false);
    expect(w.controller.getSnapshot().draft.package.route.title).toBe("Cambio local");
    expect(w.controller.getSnapshot().conflict).toBe(true);
  });
  it("reports unavailable storage and still preserves the in-memory draft", () => {
    const c = createEditorV2Controller({ state: createEditorV2State({ route: editorV2FixtureRoute() }), actorUserId: fixtureV2Id(1), storage: { setItem: () => { throw new Error("Denied"); }, removeItem: () => {} } });
    const draft = structuredClone(c.getSnapshot().draft); draft.package.route.title = "Conservado"; c.edit(draft);
    expect(c.storageAvailable()).toBe(false);
    expect(c.getSnapshot().draft.package.route.title).toBe("Conservado");
  });
});
