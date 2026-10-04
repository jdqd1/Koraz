import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { V2EditorPreviewHttpContracts } from "@cediah/contracts";
import { openPreviewV2 } from "./preview-transport";
import { PreviewV2 } from "./preview";
import { createEditorV2State, draftFromRouteV2 } from "./editor-model";
import { editorV2FixtureRoute } from "./editor-fixtures";
import { studentFixture, fixtureId } from "../../v2/fixtures";

function session() { const f = studentFixture(); return V2EditorPreviewHttpContracts.create.response.parse({ previewId: fixtureId(90), expiresAt: "2026-10-04T13:00:00Z", state: f.state, attempt: f.attempt, now: "2026-10-04T12:00:00Z", profile: "beginner", targets: [], profileWarning: null }); }
describe("T033 shared preview UI and closed editorial transport", () => {
  it("provides Spanish profiles/banner and blocks unconfirmed route opening", () => {
    const route = editorV2FixtureRoute(), state = createEditorV2State({ route });
    const html = renderToStaticMarkup(<PreviewV2 state={state} />);
    expect(html).toContain("Vista previa · no guarda progreso");
    for (const label of ["Principiante", "Diagnóstico correcto", "Error CORE"]) expect(html).toContain(label);
    const newRoute = renderToStaticMarkup(<PreviewV2 state={createEditorV2State({ draft: draftFromRouteV2(route) })} />);
    expect(newRoute).toMatch(/disabled=""[^>]*>Abrir vista previa/);
  });
  it("intercepts player retries and never sends a learner URL or persists progress", async () => {
    const f = session(), route = editorV2FixtureRoute();
    const complete = { attempt: { ...f.attempt!, status: "completed", rowVersion: 2 }, state: { ...f.state, rowVersion: 2 } };
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json(f)).mockRejectedValueOnce(new Error("lost network")).mockResolvedValueOnce(Response.json(complete));
    const storage = vi.fn(); vi.stubGlobal("window", { sessionStorage: { setItem: storage } });
    const connection = await openPreviewV2(route.pathId, route.definition, route.bindings, "beginner", f.now, fetcher);
    const client = connection.player(f.attempt!.attemptId);
    await expect(client.execute({ operation: "complete", body: { expectedVersion: 1 } })).rejects.toThrow();
    expect(client.pending()?.operation).toBe("complete");
    await client.retry();
    expect(storage).not.toHaveBeenCalled(); vi.unstubAllGlobals();
    expect(fetcher.mock.calls.every(call => String(call[0]).startsWith("/api/v2/editor/learning-paths/"))).toBe(true);
    expect(fetcher.mock.calls[1]![1]).toEqual(fetcher.mock.calls[2]![1]);
    expect(connection.getSnapshot().attempt?.status).toBe("completed");
  });
  it("checks signed image context and routes its read only through preview", async () => {
    const f = session(), route = editorV2FixtureRoute();
    const image = { activityKey: "image", attemptVersion: 1, image: { assetKey: "image", url: "https://media.example.test/figure.png", alt: "Figura", expiresAt: new Date(Date.now() + 60000).toISOString() } };
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json(f)).mockResolvedValueOnce(Response.json(image));
    const connection = await openPreviewV2(route.pathId, route.definition, route.bindings, "beginner", f.now, fetcher);
    expect((await connection.readImage(f.attempt!.attemptId, "image", "image", 1)).alt).toBe("Figura");
    expect(fetcher.mock.calls[1]![0]).toContain("/preview-sessions/");
    await expect(connection.readImage(fixtureId(999), "image", "image", 1)).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
