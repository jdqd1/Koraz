import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ session: vi.fn(), request: vi.fn() }));
vi.mock("./api-session", () => ({ getApiRequestCookie: mocks.session }));
vi.mock("./content-api", () => ({ requestContentApi: mocks.request }));
import { getCurrentUser } from "./current-user";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ status: "ready", cookie: "private-test-cookie" });
});

describe("F02 identity recovery", () => {
  it.each([
    [{ status: 503, body: {}, transportError: "timeout" }, "timeout"],
    [{ status: 503, body: {}, transportError: "connection" }, "connection"],
    [{ status: 503, body: {}, requestId: "req-fixture" }, "service"],
    [{ status: 200, body: { unexpected: "private-test-payload" } }, "invalid_response"],
  ] as const)("keeps identity failures recoverable (%s)", async (response, reason) => {
    const log = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      mocks.request.mockResolvedValue(response);
      expect(await getCurrentUser()).toMatchObject({
        status: "unavailable", reason, reference: expect.stringMatching(/^[\w-]+$/),
        retryable: reason !== "invalid_response",
      });
      expect(log).toHaveBeenCalledTimes(reason === "invalid_response" ? 1 : 2);
      expect(mocks.request).toHaveBeenCalledTimes(reason === "invalid_response" ? 1 : 2);
      expect(JSON.stringify(log.mock.calls)).not.toContain("private-test");
    } finally {
      log.mockRestore();
    }
  });

  it("treats a definite expired session as anonymous", async () => {
    mocks.request.mockResolvedValue({ status: 401, body: { error: "unauthorized" } });
    expect(await getCurrentUser()).toEqual({ status: "anonymous" });
    expect(mocks.request).toHaveBeenCalledOnce();
  });

  it("keeps a denied identity distinct and never retries permissions", async () => {
    mocks.request.mockResolvedValue({ status: 403, body: { error: "forbidden" } });
    expect(await getCurrentUser()).toMatchObject({ status: "unavailable", reason: "forbidden", retryable: false });
    expect(mocks.request).toHaveBeenCalledOnce();
  });

  it("recovers one temporary read with the same correlation and a bounded timeout", async () => {
    const body = { user: { id: "71000000-0000-4000-8000-000000000001", email: "student@example.test" }, roles: [], features: { guidedLearning: true } };
    mocks.request.mockResolvedValueOnce({ status: 503, body: {} }).mockResolvedValueOnce({ status: 200, body });
    expect(await getCurrentUser()).toMatchObject({ status: "authenticated", user: body.user });
    expect(mocks.request).toHaveBeenCalledTimes(2);
    expect(mocks.request.mock.calls[0]).toEqual(mocks.request.mock.calls[1]);
    expect(mocks.request.mock.calls[0]![0]).toMatchObject({ timeoutMs: 2500, headers: { "x-correlation-id": expect.any(String) } });
  });
});
