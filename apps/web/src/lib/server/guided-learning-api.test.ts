import { beforeEach, describe, expect, it, vi } from "vitest";
import { studentFixture } from "@/components/learning/v2/fixtures";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("./api-session", () => ({ getApiRequestCookie: async () => ({ status: "ready", cookie: "synthetic=session" }) }));
vi.mock("./content-api", () => ({ requestContentApi: mocks.request }));
import { getLearningV2Paths } from "./guided-learning-api";

beforeEach(() => vi.resetAllMocks());
describe("F07 authorized catalog reads", () => {
  const { card, state } = studentFixture();
  it("reads states and cards in one request", async () => {
    mocks.request.mockResolvedValue({ status: 200, body: { items: [card], states: [state], nextCursor: null } });
    expect(await getLearningV2Paths(undefined, true)).toMatchObject({ status: "ready", value: { states: [state] } });
    expect(mocks.request).toHaveBeenCalledOnce();
  });
  it("supports a previous strict API without dropping the cursor or cookie", async () => {
    mocks.request.mockResolvedValueOnce({ status: 400, body: { error: "invalid_request" } })
      .mockResolvedValueOnce({ status: 200, body: { items: [card], nextCursor: null } });
    expect(await getLearningV2Paths(card.id, true)).toEqual({ status: "ready", value: { items: [card], nextCursor: null } });
    expect(mocks.request.mock.calls.map(([input]) => [input.path, input.cookie])).toEqual([
      [`/v2/guided-learning/paths?limit=20&cursor=${card.id}&includeState=true`, "synthetic=session"],
      [`/v2/guided-learning/paths?limit=20&cursor=${card.id}`, "synthetic=session"],
    ]);
  });
  it.each([[401, "unauthorized"], [403, "forbidden"], [503, "unavailable"]] as const)("does not retry a catalog with HTTP %i", async (status, classification) => {
    mocks.request.mockResolvedValue({ status, body: {} });
    expect(await getLearningV2Paths(undefined, true)).toEqual({ status: classification });
    expect(mocks.request).toHaveBeenCalledOnce();
  });
});
