import { describe, expect, it, vi } from "vitest";
import { createV2Launcher, createV2Reader } from "./client";
import { studentFixture, fixtureId } from "./fixtures";
describe("T028 launcher and reader", () => {
  it("retries a lost enrollment receipt with the same identity and never calls a v1 mutation", async () => {
    const f = studentFixture(), fetcher = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(Response.json({ state: f.state }));
    const launcher = createV2Launcher(fetcher, () => fixtureId(55));
    await expect(launcher.enroll(f.path.pathId)).rejects.toThrow("offline"); await launcher.enroll(f.path.pathId);
    expect(fetcher.mock.calls[0]).toEqual(fetcher.mock.calls[1]); expect(fetcher.mock.calls[0]![0]).toBe("/api/v2/guided-learning/enrollments");
  });
  it("sends CAS and retains the attempt ID/key after an ambiguous response", async () => {
    const f = studentFixture(), fetcher = vi.fn().mockRejectedValueOnce(new Error("lost")).mockImplementation(() => Promise.resolve(Response.json({ attempt: f.attempt })));
    let id = 80; const launcher = createV2Launcher(fetcher, () => fixtureId(id++)); const target = { kind: "activity" as const, key: "practice-a" };
    await expect(launcher.start(f.state, target)).rejects.toThrow(); await launcher.start(f.state, target);
    expect(fetcher.mock.calls[0]).toEqual(fetcher.mock.calls[1]); const body = JSON.parse(fetcher.mock.calls[0]![1].body);
    expect(body).toMatchObject({ expectedEnrollmentVersion: 4, enrollmentId: f.state.enrollmentId, clientAttemptId: fixtureId(81), target });
    await launcher.start({ ...f.state, rowVersion: 5 }, target); expect(fetcher.mock.calls[2]![1].headers["Idempotency-Key"]).not.toBe(fixtureId(80));
  });
  it("resumes by reading an owned attempt without creating another", async () => {
    const f = studentFixture("resume"), fetcher = vi.fn().mockResolvedValue(Response.json({ attempt: f.attempt })); await createV2Launcher(fetcher).resume(f.attempt.attemptId);
    expect(fetcher.mock.calls[0]).toEqual([`/api/v2/guided-learning/attempts/${f.attempt.attemptId}`, { cache: "no-store" }]);
  });
  it.each([401, 403, 404, 409, 503])("never accepts an HTTP %s as success", async status => {
    const f = studentFixture(); await expect(createV2Launcher(vi.fn().mockResolvedValue(Response.json({ state: f.state }, { status }))).enroll(f.path.pathId)).rejects.toThrow();
  });
  it("rejects private fields in public state rather than displaying them", async () => {
    const f = studentFixture(), fetcher = vi.fn().mockResolvedValue(Response.json({ state: { ...f.state, solution: "private" } })); await expect(createV2Reader(fetcher).state(f.state.enrollmentId)).rejects.toThrow();
  });
  it("reads all catalog pages and detects a looping cursor", async () => {
    const f = studentFixture(), fetcher = vi.fn().mockResolvedValueOnce(Response.json({ items: [f.card], nextCursor: fixtureId(70) })).mockResolvedValueOnce(Response.json({ items: [], nextCursor: null }));
    expect(await createV2Reader(fetcher).cards()).toEqual([f.card]); expect(fetcher.mock.calls[1]![0]).toContain("cursor=");
    await expect(createV2Reader(vi.fn().mockImplementation(() => Promise.resolve(Response.json({ items: [], nextCursor: fixtureId(70) })))).cards()).rejects.toThrow("completar el catálogo");
  });
});
