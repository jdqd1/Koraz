import assert from "node:assert/strict";
import { createGuidedV2Postgres } from "../../apps/api/test/helpers/guided-v2-postgres.js";
import { buildApp } from "../../apps/api/src/app.js";
import { readEnvironment } from "../../apps/api/src/config.js";

assert.equal(process.env.NODE_ENV, "test");
assert.equal(process.env.KORAZ_TEST_DATABASE, "true");
const db = await createGuidedV2Postgres();
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => String(input).startsWith("https://api.pwnedpasswords.com/range/")
  ? new Response("00000000000000000000000000000000000:0") : originalFetch(input, init);
const app = await buildApp(readEnvironment({ NODE_ENV: "test", DATABASE_URL: db.url,
  DATABASE_MIGRATIONS_ENABLED: "false", BETTER_AUTH_URL: "http://127.0.0.1:31044",
  BETTER_AUTH_SECRET: "local-auth-test-secret-32-characters", AUTH_PROXY_SECRET: "local-proxy-test-secret-32-characters",
  AUTH_REQUIRE_EMAIL_VERIFICATION: "false", WEB_ORIGINS: "http://127.0.0.1:31044" }));
app.get("/__test/ready", async () => ({ realBetterAuth: true, disposableDatabase: true, breachService: "fixture" }));
app.post("/__test/stop", async () => { setTimeout(() => void close(), 100); return { stopping: true }; });
async function close() { await app.close(); await db.close(); process.exit(0); }
await app.listen({ host: "127.0.0.1", port: 41044 });
console.log("Disposable auth API ready on 41044");
process.once("SIGINT", () => void close());
