import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { V2HttpContracts } from "@cediah/contracts";
import { createV2UpgradeClient } from "./upgrade-client";
import { V2Upgrade } from "./upgrade";
import { fixtureId, studentFixture } from "./fixtures";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
const body = { targetVersionId: fixtureId(8) as typeof V2HttpContracts.upgradeCommit.body._output.targetVersionId, expectedVersion: 1, acknowledgedReset: true as const };
describe("T034 upgrade transport and notice", () => {
  it("requires explicit acknowledgement and renders maintenance without an action", () => {
    const html = renderToString(<V2Upgrade enrollmentId={fixtureId(3)} expectedVersion={1} disabled />);
    expect(html).toContain("mantenimiento"); expect(html).toContain("historial se conservan"); expect(html).not.toContain("<button");
    expect(() => V2HttpContracts.upgradeCommit.body.parse({ ...body, acknowledgedReset: false })).toThrow();
  });
  it("reads the strict preview without a mutation", async () => {
    const fetcher = vi.fn(async () => Response.json({ targetVersionId: fixtureId(8), objectiveImpact: [{ objectiveKey: "core", willResetEvidence: true }], openAttempt: true }));
    const client = createV2UpgradeClient(fixtureId(3), fetcher, () => fixtureId(9), () => null);
    expect(await client.preview()).toMatchObject({ openAttempt: true });
    expect(fetcher).toHaveBeenCalledWith(`/api/v2/guided-learning/enrollments/${fixtureId(3)}/upgrade`, { cache: "no-store" });
  });
  it("recovers a lost receipt after recreation with the exact body and key", async () => {
    const entries = new Map<string, string>();
    const store = { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => { entries.set(key, value); }, removeItem: (key: string) => { entries.delete(key); } };
    const state = studentFixture("mastered").state;
    const fetcher = vi.fn().mockRejectedValueOnce(new Error("Lost receipt")).mockResolvedValueOnce(Response.json({ state }));
    const first = createV2UpgradeClient(fixtureId(3), fetcher, () => fixtureId(9), () => store);
    await expect(first.commit(body)).rejects.toThrow("Lost receipt");
    const next = createV2UpgradeClient(fixtureId(3), fetcher, () => fixtureId(10), () => store);
    expect(next.hasPending()).toBe(true); await next.retry();
    expect(fetcher.mock.calls[1]).toEqual(fetcher.mock.calls[0]); expect(entries.size).toBe(0);
  });
  it("definite CAS rejection clears the pending request and never changes client progress", async () => {
    const fetcher = vi.fn(async () => Response.json({ error: "version_conflict" }, { status: 409 }));
    const client = createV2UpgradeClient(fixtureId(3), fetcher, () => fixtureId(9), () => null);
    await expect(client.commit(body)).rejects.toMatchObject({ status: 409 }); expect(client.hasPending()).toBe(false);
  });
});
