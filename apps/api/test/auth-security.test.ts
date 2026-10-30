import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash, randomUUID } from "node:crypto";
import { createBetterAuthService, type AuthService } from "../src/auth.js";
import { createGuidedV2Postgres } from "./helpers/guided-v2-postgres.js";

describe.skipIf(process.env.KORAZ_TEST_DATABASE !== "true")("database-backed authentication", () => {
  let db: Awaited<ReturnType<typeof createGuidedV2Postgres>>;
  let auth: AuthService;
  let second: AuthService;
  const password = "Xy9mT2qR";
  const proxySecret = "test-only-proxy-secret-32-characters";
  let compromised = false;
  let unavailable = false;
  beforeAll(async () => {
    db = await createGuidedV2Postgres();
    auth = createBetterAuthService({ databaseUrl: db.url, publicUrl: "http://localhost:3000",
      secret: "test-only-auth-secret-32-characters", proxySecret,
      requireEmailVerification: false, trustedOrigins: ["http://localhost:3000"] }, { pool: db.pool });
    second = createBetterAuthService({ databaseUrl: db.url, publicUrl: "http://localhost:3000",
      secret: "test-only-auth-secret-32-characters", proxySecret,
      requireEmailVerification: false, trustedOrigins: ["http://localhost:3000"] }, { pool: db.pool });
    vi.stubGlobal("fetch", vi.fn(async (input: string) => {
      expect(String(input)).toMatch(/^https:\/\/api\.pwnedpasswords\.com\/range\/[A-F0-9]{5}$/);
      if (unavailable) throw new Error("offline");
      return new Response(compromised ? createHash("sha1").update(password).digest("hex").toUpperCase().slice(5) + ":10" : "00000000000000000000000000000000000:0");
    }));
  }, 120000);
  beforeEach(async () => { compromised = false; unavailable = false; await db.pool.query("delete from auth_rate_limits"); });
  afterAll(async () => { await auth?.close(); await second?.close(); await db?.close(); vi.unstubAllGlobals(); });
  function request(path: string, body?: unknown, cookie?: string, origin = "http://localhost:3000", secret = proxySecret, service = auth) {
    return service.handle(new Request("http://localhost:3000/api/auth/" + path, { method: body ? "POST" : "GET",
      headers: { "content-type": "application/json", origin, "x-forwarded-for": "192.0.2.1",
        "x-auth-proxy-secret": secret, ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined }));
  }
  async function signup(rememberMe?: boolean) {
    const email = randomUUID() + "@example.test";
    const response = await request("sign-up/email", { email, password, name: "Alumno", ...(rememberMe === undefined ? {} : { rememberMe }) });
    expect(response.status).toBe(200);
    const data = await response.json();
    const cookies = response.headers.getSetCookie();
    return { email, data, cookies, cookie: cookies.map(v => v.split(";")[0]).join("; ") };
  }
  async function age(token: string, days: number) {
    await db.pool.query("alter table auth_sessions disable trigger auth_sessions_set_updated_at");
    try { await db.pool.query("update auth_sessions set created_at=now()-($2::int*interval '1 day'),updated_at=now()-interval '2 days' where token=$1", [token, days]); }
    finally { await db.pool.query("alter table auth_sessions enable trigger auth_sessions_set_updated_at"); }
  }
  it("registers immediately with exactly eight characters and no symbol; rejects direct policy bypass", async () => {
    const user = await signup(true);
    expect(await auth.getUser({ cookie: user.cookie })).toMatchObject({ email: user.email });
    expect(user.data.user.emailVerified).toBe(false);
    expect((await db.pool.query("select role from user_roles where user_id=$1", [user.data.user.id])).rows).toEqual([{ role: "student" }]);
    expect((await db.pool.query("select issuer,password from auth_accounts where user_id=$1", [user.data.user.id])).rows[0]).toMatchObject({ issuer: "local:credential", password: expect.not.stringContaining(password) });
    for (const bad of ["Short12", "abcdefgh", "ABCDEFG1", "abcdefgh1"]) {
      expect((await request("sign-up/email", { email: randomUUID()+"@example.test", name: "Alumno", password: bad })).status).toBe(400);
    }
  });
  it("rejects leaked passwords and check failures without creating partial accounts", async () => {
    const count = async () => Number((await db.pool.query("select count(*) n from auth_users")).rows[0].n);
    const before = await count();
    compromised = true;
    const payload = { email: randomUUID()+"@example.test", name: "Alumno", password };
    expect((await request("sign-up/email", payload)).status).toBe(400);
    compromised = false; unavailable = true;
    expect((await request("sign-up/email", payload)).status).toBe(500);
    expect(await count()).toBe(before);
  });
  it("persists opt-in with a secure cookie lifetime and keeps opt-out ephemeral", async () => {
    const remembered = await signup(true), temporary = await signup(false), omitted = await signup();
    expect(remembered.cookies.find(v => v.startsWith("cediah.session_token="))).toMatch(/HttpOnly.*SameSite=Lax.*Max-Age=25919\d\d/i);
    for (const user of [temporary, omitted]) {
      expect(user.cookies.find(v => v.startsWith("cediah.session_token="))).not.toMatch(/Max-Age|Expires/i);
      const row = (await db.pool.query("select remember_me,expires_at-created_at lifetime from auth_sessions where token=$1", [user.data.token])).rows[0];
      expect(row.remember_me).toBe(false);
      expect(row.lifetime.days).toBeLessThanOrEqual(1);
    }
  });
  it("bounds an unresponsive breach check and leaves no partial user", async () => {
    vi.mocked(globalThis.fetch).mockImplementationOnce(() => new Promise<Response>(() => {}));
    const email = randomUUID()+"@example.test";
    expect((await request("sign-up/email", { email, password, name: "Alumno" })).status).toBe(503);
    expect((await db.pool.query("select id from auth_users where email=$1", [email])).rows).toHaveLength(0);
  }, 15000);
  it("renews only through HTTP and delivers the new cookie", async () => {
    const user = await signup(true); await age(user.data.token, 2);
    const before = (await db.pool.query("select expires_at,updated_at from auth_sessions where token=$1", [user.data.token])).rows[0];
    await auth.getUser({ cookie: user.cookie });
    expect((await db.pool.query("select expires_at,updated_at from auth_sessions where token=$1", [user.data.token])).rows[0]).toEqual(before);
    const result = await request("get-session", undefined, user.cookie);
    expect(result.headers.getSetCookie().join(";")).toContain("Max-Age=");
    expect(new Date((await result.json()).session.updatedAt).getTime()).toBeGreaterThan(before.updated_at.getTime());
    expect((await request("get-session", undefined, user.cookie)).headers.getSetCookie().filter(c => c.includes("Max-Age="))).toHaveLength(0);
  });
  it("caps renewal at day 90 and cannot extend a temporary or legacy session", async () => {
    const user = await signup(true); await age(user.data.token, 80);
    await request("get-session", undefined, user.cookie);
    const row = (await db.pool.query("select extract(epoch from expires_at-created_at)::int seconds from auth_sessions where token=$1", [user.data.token])).rows[0];
    expect(row.seconds).toBe(90*86400);
    const temporary = await signup(false); await age(temporary.data.token, 2);
    const cleanCookie = temporary.cookie.split(";").filter(c => !c.includes("dont_remember")).join(";");
    const expiry = (await db.pool.query("select expires_at from auth_sessions where token=$1", [temporary.data.token])).rows[0].expires_at;
    await request("get-session", undefined, cleanCookie);
    expect((await db.pool.query("select expires_at from auth_sessions where token=$1", [temporary.data.token])).rows[0].expires_at).toEqual(expiry);
    await db.pool.query("update auth_sessions set remember_me=null where token=$1", [temporary.data.token]);
    await request("get-session", undefined, cleanCookie);
    expect((await db.pool.query("select expires_at from auth_sessions where token=$1", [temporary.data.token])).rows[0].expires_at).toEqual(expiry);
  });
  it("rejects forged cookies, expired sessions and cross-origin mutations", async () => {
    const user = await signup(true);
    expect(await auth.getUser({ cookie: "cediah.session_token=forged.invalid" })).toBeNull();
    expect((await request("sign-out", {}, user.cookie, "https://attacker.example")).status).toBe(403);
    await db.pool.query("update auth_sessions set expires_at=now()-interval '1 second' where token=$1", [user.data.token]);
    expect(await auth.getUser({ cookie: user.cookie })).toBeNull();
  });
  it("revokes in the database and rejects exact replay; global revocation requires the password", async () => {
    const user = await signup(true);
    expect((await request("revoke-sessions", { password: "incorrect" }, user.cookie)).status).toBe(400);
    expect(await auth.getUser({ cookie: user.cookie })).not.toBeNull();
    expect((await request("revoke-sessions", { password }, user.cookie)).status).toBe(200);
    expect(await auth.getUser({ cookie: user.cookie })).toBeNull();
    const other = await signup(true);
    expect((await request("sign-out", {}, other.cookie)).status).toBe(200);
    expect(await auth.getUser({ cookie: other.cookie })).toBeNull();
  });
  it("changes passwords only with the current password and invalidates previous sessions", async () => {
    const user = await signup(true);
    expect((await request("change-password", { currentPassword: "wrong", newPassword: "Another12" }, user.cookie)).status).toBe(400);
    expect((await request("change-password", { currentPassword: password, newPassword: "Another12", revokeOtherSessions: false }, user.cookie)).status).toBe(200);
    expect(await auth.getUser({ cookie: user.cookie })).toBeNull();
  });
  it("shares atomic attempt limits between concurrent requests", async () => {
    const user = await signup(false);
    const responses = await Promise.all(Array.from({ length: 12 }, (_, i) => request("sign-in/email", { email: user.email, password: "wrong" }, undefined, "http://localhost:3000", proxySecret, i % 2 ? auth : second)));
    expect(responses.filter(r => r.status === 429).length).toBe(7);
    expect(responses.filter(r => r.status === 429).every(r => Number(r.headers.get("Retry-After")) > 0)).toBe(true);
  });
  it("blocks the direct API without its proxy secret and never claims to send unavailable recovery email", async () => {
    expect((await request("get-session", undefined, undefined, "http://localhost:3000", "fake")).status).toBe(401);
    expect((await request("request-password-reset", { email: "someone@example.test" })).status).toBe(503);
  });
});
