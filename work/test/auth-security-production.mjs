import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

// Explicit opt-in: this creates one disposable student account on production.
assert.equal(process.env.KORAZ_AUTH_PRODUCTION_SMOKE, "true");
const origin = "https://koraz.app";
const email = `qa-auth-${randomUUID()}@example.test`;
let password;
do { password = randomBytes(9).toString("base64url").slice(0, 8); }
while (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password));
const output = new URL("./auth-security/production.json", import.meta.url);
let userId;
const checks = {};
async function request(path, body, cookie) {
  return fetch(origin + "/api/auth/" + path, { method: body ? "POST" : "GET",
    headers: { origin, "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined });
}
const cookieHeader = response => response.headers.getSetCookie().map(c => c.split(";")[0]).join("; ");
try {
  const signup = await request("sign-up/email", { name: "QA autenticación desechable", email, password, rememberMe: true });
  assert.equal(signup.status, 200, `Signup HTTP ${signup.status}`);
  const data = await signup.json(); userId = data.user.id;
  checks.immediateEightCharacterRegistration = true;
  const persistent = cookieHeader(signup);
  const cookie = signup.headers.getSetCookie().find(c => /session_token=/.test(c));
  assert.ok(cookie?.includes("HttpOnly") && cookie.includes("Secure") && cookie.includes("SameSite=Lax") && cookie.includes("Max-Age="));
  checks.persistentCookie = true;
  const session = await (await request("get-session", undefined, persistent)).json();
  assert.equal(session.user.id, userId); assert.equal(session.session.rememberMe, true);
  checks.databaseBackedSession = true;
  assert.equal((await request("sign-out", {}, persistent)).status, 200);
  assert.equal(await (await request("get-session", undefined, persistent)).json(), null);
  checks.revocationRejectsReplay = true;
  const login = await request("sign-in/email", { email, password, rememberMe: false });
  assert.equal(login.status, 200);
  assert.ok(!/Max-Age|Expires/i.test(login.headers.getSetCookie().find(c => /session_token=/.test(c)) ?? "missing"));
  checks.temporaryCookie = true;
  const temporary = cookieHeader(login);
  const cross = await fetch(origin + "/api/auth/sign-out", { method: "POST", headers: {
    "Content-Type": "application/json", origin: "https://attacker.example", cookie: temporary }, body: "{}" });
  assert.equal(cross.status, 403); checks.csrfRejected = true;
  assert.equal((await fetch("https://cediah-api.onrender.com/api/auth/get-session")).status, 401);
  checks.directApiRejected = true;
  assert.equal((await request("sign-out", {}, temporary)).status, 200);
  console.log(JSON.stringify({ status: "PASS", ...checks, cleanupRequired: { userId, email } }));
} finally {
  await mkdir(new URL("./auth-security/", import.meta.url), { recursive: true });
  await writeFile(output, JSON.stringify({ checkedAt: new Date().toISOString(), checks, cleanupRequired: userId ? { userId, email } : null }, null, 2));
}
