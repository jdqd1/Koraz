import { beforeEach, describe, expect, it, vi } from "vitest";
import { studentFixture, fixtureId } from "@/components/learning/v2/fixtures";
import { learningVisualPaths } from "@/components/learning/learning-visual-fixtures";
const api = vi.hoisted(() => ({ getLearningPaths: vi.fn(), getLearningV2Paths: vi.fn(), getLearningV2State: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("./guided-learning-api", () => api);
import { getLearningOverview } from "./learning-overview";
beforeEach(() => vi.resetAllMocks());

describe("F05 overview request isolation and pagination", () => {
  it("loads both catalogs beyond page one, deduplicating and checking adopted revision", async () => {
    const { card, state } = studentFixture();
    api.getLearningPaths.mockResolvedValueOnce({ status: "ready", items: [], nextCursor: "v1-next" })
      .mockResolvedValueOnce({ status: "ready", items: learningVisualPaths, nextCursor: null });
    api.getLearningV2Paths.mockResolvedValueOnce({ status: "ready", value: { items: [card], nextCursor: "v2-next" } })
      .mockResolvedValueOnce({ status: "ready", value: { items: [card], nextCursor: null } });
    api.getLearningV2State.mockResolvedValue({ status: "ready", value: { state: { ...state, pathVersionId: fixtureId(999) } } });
    const result = await getLearningOverview();
    expect(api.getLearningPaths).toHaveBeenNthCalledWith(2, "v1-next");
    expect(api.getLearningV2Paths).toHaveBeenNthCalledWith(2, "v2-next", true);
    expect(result.paths).toHaveLength(learningVisualPaths.length + 1);
    expect(result.v2Routes).toEqual([{ card, state: null }]);
  });
  it("keeps partial errors explicit and never reuses a previous user's routes", async () => {
    const { card, state } = studentFixture();
    api.getLearningPaths.mockResolvedValue({ status: "ready", items: [], nextCursor: null });
    api.getLearningV2Paths.mockResolvedValueOnce({ status: "ready", value: { items: [card], nextCursor: "broken" } })
      .mockResolvedValueOnce({ status: "unavailable" })
      .mockResolvedValueOnce({ status: "ready", value: { items: [], nextCursor: null } });
    api.getLearningV2State.mockResolvedValue({ status: "ready", value: { state } });
    expect(await getLearningOverview()).toMatchObject({ v2Unavailable: true, v2Routes: [{ card, state }] });
    expect(await getLearningOverview()).toMatchObject({ v2Unavailable: false, v2Routes: [], paths: [] });
  });
  it("reuses only embedded states of the current enrollment and adopted revision", async () => {
    const { card, state } = studentFixture();
    api.getLearningPaths.mockResolvedValue({ status: "ready", items: [], nextCursor: null });
    api.getLearningV2Paths.mockResolvedValueOnce({ status: "ready", value: { items: [card], states: [state], nextCursor: null } })
      .mockResolvedValueOnce({ status: "ready", value: { items: [card], states: [{ ...state, pathVersionId: fixtureId(999) }], nextCursor: null } })
      .mockResolvedValueOnce({ status: "ready", value: { items: [], states: [], nextCursor: null } });
    expect((await getLearningOverview()).v2Routes).toEqual([{ card, state }]);
    expect((await getLearningOverview()).v2Routes).toEqual([{ card, state: null }]);
    expect((await getLearningOverview()).v2Routes).toEqual([]);
    expect(api.getLearningV2State).not.toHaveBeenCalled();
  });
});
