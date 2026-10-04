import { beforeEach, describe, expect, it, vi } from "vitest";
import { studentFixture } from "./fixtures";
import { learningVisualPathDetail, learningVisualAttempt } from "../learning-visual-fixtures";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ session: vi.fn(), request: vi.fn() }));
vi.mock("@/lib/server/api-session", () => ({ getApiRequestCookie: mocks.session }));
vi.mock("@/lib/server/content-api", () => ({ requestContentApi: mocks.request }));
import { getPathForEngine, getAttemptForEngine } from "./server";
beforeEach(() => { vi.clearAllMocks(); mocks.session.mockResolvedValue({ status: "ready", cookie: "test=session" }); });
describe("T028 page dispatch", () => {
  it("keeps a v1 enrolled route and attempt on the legacy API", async () => {
    mocks.request.mockResolvedValueOnce({ status: 200, body: learningVisualPathDetail }).mockResolvedValueOnce({ status: 200, body: learningVisualAttempt });
    expect(await getPathForEngine("route")).toMatchObject({ status: "ready", engineVersion: "guided-v1", path: learningVisualPathDetail });
    expect(await getAttemptForEngine(learningVisualAttempt.id)).toMatchObject({ status: "ready", engineVersion: "guided-v1" }); expect(mocks.request).toHaveBeenCalledTimes(2);
  });
  it.each([404, 409])("dispatches a v2 route only after legacy absence/mismatch (%s) and a validated v2 DTO", async status => {
    const f = studentFixture(); mocks.request.mockResolvedValueOnce({ status, body: { error: "engine_version_mismatch" } }).mockResolvedValueOnce({ status: 200, body: { path: f.path } });
    expect(await getPathForEngine(f.path.slug)).toEqual({ status: "ready", engineVersion: "guided-v2", path: f.path });
    expect(mocks.request.mock.calls.map(call => call[0].path)).toEqual([`/v1/guided-learning/paths/${f.path.slug}`, `/v2/guided-learning/paths/${f.path.slug}`]);
  });
  it("dispatches a v2 session read while preserving the owned snapshot", async () => {
    const f = studentFixture(); mocks.request.mockResolvedValueOnce({ status: 404, body: {} }).mockResolvedValueOnce({ status: 200, body: { attempt: f.attempt } });
    expect(await getAttemptForEngine(f.attempt.attemptId)).toEqual({ status: "ready", engineVersion: "guided-v2", attempt: f.attempt });
  });
  it.each([401, 403, 503, 409])("does not mask a legacy error %s as authority to try another engine", async status => {
    mocks.request.mockResolvedValue({ status, body: { error: "unavailable" } }); expect((await getPathForEngine("route")).status).not.toBe("ready"); expect(mocks.request).toHaveBeenCalledTimes(1);
  });
  it("rejects malformed/private v2 DTOs and retains denied state", async () => {
    const f = studentFixture(); mocks.request.mockResolvedValueOnce({ status: 404, body: {} }).mockResolvedValueOnce({ status: 200, body: { path: { ...f.path, solutions: [] } } }); expect((await getPathForEngine(f.path.slug)).status).toBe("unavailable");
    mocks.request.mockResolvedValueOnce({ status: 404, body: {} }).mockResolvedValueOnce({ status: 403, body: {} }); expect((await getPathForEngine(f.path.slug)).status).toBe("forbidden");
  });
});
