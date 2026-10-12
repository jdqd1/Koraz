import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { editorFixture } from "@/components/learning/editor/editor-fixtures";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }), redirect: vi.fn(), notFound: vi.fn() }));
const mocks = vi.hoisted(() => ({ current: vi.fn(), legacy: vi.fn(), v2: vi.fn(), session: vi.fn(), request: vi.fn() }));
vi.mock("@/lib/server/current-user", () => ({ getCurrentUser: mocks.current }));
vi.mock("@/lib/server/guided-learning-api", () => ({ getLearningEditorWorkspace: mocks.legacy, getLearningV2EditorWorkspace: mocks.v2 }));
vi.mock("@/lib/server/api-session", () => ({ getApiRequestCookie: mocks.session }));
vi.mock("@/lib/server/content-api", () => ({ requestContentApi: mocks.request, getContentApiError: () => "unavailable" }));
import Page from "./page";
import { GET } from "@/app/api/v2/editor/learning-paths/route";

const v2 = { pathId: "72000000-0000-4000-8000-000000000099", title: "Vascularización del abdomen", topicTitle: "Anatomía", unitCount: 4, status: "published", versionNumber: 1, archivedAt: null };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.current.mockResolvedValue({ status: "authenticated", features: { guidedLearning: true }, roles: ["administrator"] });
  mocks.legacy.mockResolvedValue({ status: "ready", items: [editorFixture("ready").initialPath!] });
  mocks.v2.mockResolvedValue({ status: "ready", value: { items: [v2] } });
  mocks.session.mockResolvedValue({ status: "ready", cookie: "test-session" });
  mocks.request.mockResolvedValue({ status: 200, body: { items: [], topics: [], nextCursor: null } });
});
describe("editor route workspace across engines", () => {
  it("renders the v2 editorial catalogue beside the existing route", async () => {
    const html = renderToStaticMarkup(await Page());
    expect(mocks.v2).toHaveBeenCalledOnce();
    expect(html).toContain(v2.title);
    expect(html).toContain(editorFixture("ready").initialPath!.title);
    expect(html).toContain(`/panel/rutas/${v2.pathId}`);
  });
  it.each(["unavailable", "not_found", "unauthorized"])("does not silently hide a failed v2 listing: %s", async (status) => {
    mocks.v2.mockResolvedValue({ status });
    expect(renderToStaticMarkup(await Page())).toContain("No pudimos cargar todas tus rutas");
  });
  it("forwards the private list through the BFF and rejects malformed success responses", async () => {
    mocks.request.mockResolvedValueOnce({ status: 200, body: { items: [v2] } });
    const response = await GET(new Request("https://koraz.app/api/v2/editor/learning-paths"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({ path: "/v2/editor/learning-paths", method: "GET", cookie: "test-session" }));
    mocks.request.mockResolvedValueOnce({ status: 200, body: { items: [{ title: "Invalid" }] } });
    expect((await GET(new Request("https://koraz.app/api/v2/editor/learning-paths"))).status).toBe(502);
  });
});
