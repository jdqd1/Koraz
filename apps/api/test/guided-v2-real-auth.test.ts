import { afterAll, beforeAll, expect, it, describe } from "vitest";
import { randomUUID } from "node:crypto";
import { createRealAuthHarness } from "../../../work/test/t042/real-auth-server.mjs";

describe.skipIf(process.env.KORAZ_TEST_DATABASE !== "true")("T042 real Better Auth session expiry", () => {
  let h: Awaited<ReturnType<typeof createRealAuthHarness>>;
  beforeAll(async () => { h = await createRealAuthHarness(); }, 120000);
  afterAll(async () => { await h?.close(); });
  it("accepts an issued signed cookie, rejects a forged cookie, then rejects exact replay after persisted expiry without effects", async () => {
    const { userId, cookie } = await h.signUp();
    expect((await h.auth.getUser({ cookie }))?.id).toBe(userId);
    expect(await h.auth.getUser({ cookie: cookie.replace(/session_token=[^;]+/, "session_token=forged.invalid") })).toBeNull();
    const path = "/v2/guided-learning/enrollments", key = randomUUID(), body = { pathId: h.h.fixtures.small!.pathId };
    const request = () => h.app.inject({ method: "POST", url: path, headers: { cookie, origin: "http://127.0.0.1:31043", "idempotency-key": key }, payload: body });
    const accepted = await request(); expect(accepted.statusCode).toBe(200);
    const replay = await request(); expect(replay.statusCode).toBe(200); expect(replay.json()).toEqual(accepted.json());
    const before = await h.fingerprint();
    await h.expire(userId);
    expect(await h.auth.getUser({ cookie })).toBeNull();
    const rejected = await request(); expect(rejected.statusCode).toBe(401);
    expect(await h.fingerprint()).toEqual(before);
  }, 30000);
});
