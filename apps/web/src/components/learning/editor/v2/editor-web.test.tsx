import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import { editorV2FixtureRoute, fixtureV2Id } from "./editor-fixtures";
import { editorFixture } from "../editor-fixtures";
import { LearningRouteEditor } from "../learning-route-editor-facade";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ session: vi.fn(), request: vi.fn() }));
vi.mock("@/lib/server/api-session", () => ({ getApiRequestCookie: mocks.session }));
vi.mock("@/lib/server/content-api", () => ({ requestContentApi: mocks.request, getContentApiError: () => "unavailable" }));
import { getLearningEditorPathForEngine } from "@/lib/server/guided-learning-api";
import { POST } from "@/app/api/v2/editor/learning-paths/route";
import { GET, PATCH } from "@/app/api/v2/editor/learning-paths/[...path]/route";
import { GET as sourceCatalog } from "@/app/api/v2/editor/learning-paths/source-catalog/route";

beforeEach(() => { vi.clearAllMocks(); mocks.session.mockResolvedValue({ status: "ready", cookie: "test=session" }); });
describe("T023 web dispatch and BFF", () => {
  it("forwards the T024 source catalogue privately and rejects invalid query/session/DTO", async () => {
    const body = { topics: [{ id: fixtureV2Id(3), title: "Tema" }], items: [], nextCursor: null };
    mocks.request.mockResolvedValue({ status: 200, body });
    const result = await sourceCatalog(new Request("http://localhost/api/v2/editor/learning-paths/source-catalog?q=gu%C3%ADa"));
    expect(result.status).toBe(200); expect(result.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await result.json()).toEqual(body);
    expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({ path: "/v2/editor/learning-paths/source-catalog?limit=24&q=gu%C3%ADa", cookie: "test=session", method: "GET" }));
    for (const query of ["?limit=200", "?cursor=unknown", "?role=administrator", "?q=a&q=b"]) expect((await sourceCatalog(new Request(`http://localhost/api/v2/editor/learning-paths/source-catalog${query}`))).status).toBe(400);
    mocks.session.mockResolvedValue({ status: "anonymous" });
    expect((await sourceCatalog(new Request("http://localhost/api/v2/editor/learning-paths/source-catalog"))).status).toBe(401);
    mocks.session.mockResolvedValue({ status: "ready", cookie: "test=session" }); mocks.request.mockResolvedValue({ status: 200, body: { ...body, payload: "private" } });
    expect((await sourceCatalog(new Request("http://localhost/api/v2/editor/learning-paths/source-catalog"))).status).toBe(502);
  });
  it("dispatches a bound v2 route to five sections and keeps v1 in its existing shell", () => {
    const fixture = editorFixture("ready");
    const v1 = renderToString(<LearningRouteEditor {...fixture} />);
    expect(v1).toContain('data-engine-version="guided-v1"');
    expect(v1).not.toContain("Evaluación y repaso");
    const v2 = renderToString(<LearningRouteEditor {...fixture} initialPath={editorV2FixtureRoute()} />);
    expect(v2).toContain('data-engine-version="guided-v2"');
    for (const label of ["Datos y fuentes", "Objetivos", "Recorrido", "Evaluación y repaso", "Revisión"]) expect(v2).toContain(label);
  });
  it("loads v2 only on the explicit legacy engine mismatch", async () => {
    const route = editorV2FixtureRoute();
    mocks.request.mockResolvedValueOnce({ status: 409, body: { error: "engine_version_mismatch" } }).mockResolvedValueOnce({ status: 200, body: { route } });
    expect(await getLearningEditorPathForEngine(route.pathId)).toEqual({ status: "ready", engineVersion: "guided-v2", path: route });
    expect(mocks.request.mock.calls.map((call) => call[0].path)).toEqual([`/v1/editor/learning-paths/${route.pathId}`, `/v2/editor/learning-paths/${route.pathId}`]);
  });
  it.each([401, 403, 404, 503, 409])("does not mask a legacy %s as permission to load v2", async (status) => {
    mocks.request.mockResolvedValue({ status, body: { error: "conflict" } });
    expect((await getLearningEditorPathForEngine(fixtureV2Id(2))).status).not.toBe("ready");
    expect(mocks.request).toHaveBeenCalledTimes(1);
  });
  it("keeps v1 loading on its original endpoint", async () => {
    const route = editorFixture("ready").initialPath;
    mocks.request.mockResolvedValue({ status: 200, body: route });
    expect(await getLearningEditorPathForEngine(route!.id)).toEqual({ status: "ready", engineVersion: "guided-v1", path: route });
    expect(mocks.request).toHaveBeenCalledTimes(1);
  });
  it("forwards PATCH with the existing session, origin check, key, CAS and private cache", async () => {
    const route = editorV2FixtureRoute();
    mocks.request.mockResolvedValue({ status: 200, body: { route } });
    const body = { package: route.definition, bindings: route.bindings, expectedVersion: 1 };
    const request = new Request(`http://localhost/api/v2/editor/learning-paths/${route.pathId}`, { method: "PATCH", body: JSON.stringify(body), headers: { origin: "http://localhost", "Idempotency-Key": fixtureV2Id(100), "Content-Type": "application/json" } });
    const result = await PATCH(request, { params: Promise.resolve({ path: [route.pathId] }) });
    expect(result.status).toBe(200);
    expect(result.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mocks.request).toHaveBeenCalledWith({ body, cookie: "test=session", method: "PATCH", path: `/v2/editor/learning-paths/${route.pathId}`, headers: { "Idempotency-Key": fixtureV2Id(100) } });
  });
  it("rejects cross-origin mutations, anonymous reads and unsupported path suffixes", async () => {
    const id = fixtureV2Id(2);
    const request = new Request(`http://localhost/api/v2/editor/learning-paths/${id}`, { method: "PATCH", body: "{}", headers: { origin: "https://evil.example" } });
    expect((await PATCH(request, { params: Promise.resolve({ path: [id] }) })).status).toBe(403);
    expect(mocks.request).not.toHaveBeenCalled();
    mocks.session.mockResolvedValue({ status: "anonymous" });
    expect((await GET(new Request(`http://localhost/api/v2/editor/learning-paths/${id}`), { params: Promise.resolve({ path: [id] }) })).status).toBe(401);
    expect((await GET(new Request("http://localhost/api/v2/editor/learning-paths/unknown"), { params: Promise.resolve({ path: [id, "unsupported"] }) })).status).toBe(404);
  });
  it("creates through the POST contract and preserves 409 errors through the BFF", async () => {
    const route = editorV2FixtureRoute();
    const draft = { pathId: route.pathId, pathVersionId: route.pathVersionId, editVersion: 1, status: "draft" };
    mocks.request.mockResolvedValueOnce({ status: 200, body: draft });
    const response = await POST(new Request("http://localhost/api/v2/editor/learning-paths", { method: "POST", body: JSON.stringify({ package: route.definition, bindings: route.bindings }), headers: { origin: "http://localhost", "Idempotency-Key": fixtureV2Id(100) } }));
    expect(await response.json()).toEqual(draft);
    mocks.request.mockResolvedValueOnce({ status: 409, body: { error: "version_conflict" } });
    const conflict = await PATCH(new Request(`http://localhost/api/v2/editor/learning-paths/${route.pathId}`, { method: "PATCH", body: "{}", headers: { origin: "http://localhost" } }), { params: Promise.resolve({ path: [route.pathId] }) });
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toEqual({ error: "version_conflict" });
  });
});
