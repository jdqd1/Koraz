import { beforeEach, describe, expect, it, vi } from "vitest";
import { studentFixture, fixtureId } from "@/components/learning/v2/fixtures";
const api = vi.hoisted(() => ({ getLearningHome: vi.fn(), getLearningV2Paths: vi.fn(), getLearningV2Path: vi.fn(), getLearningV2State: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("./guided-learning-api", () => api);
import { getLearningReviewCenter } from "./learning-review-center";
beforeEach(() => { vi.resetAllMocks(); api.getLearningHome.mockResolvedValue({ status: "unavailable" }); });
describe("F03 review center loading", () => {
  it("loads enrolled routes on later catalog pages, deduplicating cards", async () => {
    const a = studentFixture("review");
    const b = { ...a.card, id: fixtureId(99), slug: "second", enrollmentId: fixtureId(98) };
    api.getLearningV2Paths.mockResolvedValueOnce({ status: "ready", value: { items: [a.card], nextCursor: "page2" } })
      .mockResolvedValueOnce({ status: "ready", value: { items: [a.card, b, { ...b, id: fixtureId(97), enrollmentId: null }], nextCursor: null } });
    api.getLearningV2Path.mockResolvedValue({ status: "ready", value: { path: a.path } });
    api.getLearningV2State.mockResolvedValue({ status: "unavailable" });
    const result = await getLearningReviewCenter(5);
    expect(api.getLearningV2Paths).toHaveBeenNthCalledWith(2, "page2");
    expect(api.getLearningV2State.mock.calls).toEqual([[a.card.enrollmentId], [b.enrollmentId]]);
    expect(result.routes).toHaveLength(2);
    expect(result.routes.every(route => route.state === null)).toBe(true);
    expect(result.unavailable).toBe(false);
  });
  it("marks partial catalogs unavailable without discarding known routes", async () => {
    const a = studentFixture("review");
    api.getLearningV2Paths.mockResolvedValueOnce({ status: "ready", value: { items: [a.card], nextCursor: "next" } })
      .mockResolvedValueOnce({ status: "unavailable" });
    api.getLearningV2Path.mockResolvedValue({ status: "not_found" });
    api.getLearningV2State.mockResolvedValue({ status: "unavailable" });
    expect(await getLearningReviewCenter(10)).toMatchObject({ unavailable: true, routes: [{ path: null, state: null }] });
  });
});
