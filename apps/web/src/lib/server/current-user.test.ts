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
      });
      expect(log).toHaveBeenCalledOnce();
      expect(JSON.stringify(log.mock.calls)).not.toContain("private-test");
    } finally {
      log.mockRestore();
    }
  });

  it("treats a definite expired session as anonymous", async () => {
    mocks.request.mockResolvedValue({ status: 401, body: { error: "unauthorized" } });
    expect(await getCurrentUser()).toEqual({ status: "anonymous" });
  });
});
