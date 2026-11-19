import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import type { RoleManagementProvider } from "@cediah/contracts";

const environment = { HOST: "127.0.0.1", NODE_ENV: "test" as const, PORT: 4000,
  WEB_ORIGINS: "http://localhost:3000", webOrigins: new Set(["http://localhost:3000"]) };
const user = { id: "71000000-0000-4000-8000-000000000001", email: "student@example.test" };
const revokeSessions = async () => {};

describe("F07 identity availability and correlation", () => {
  it("uses unique server request IDs and a bounded diagnostic reference, without trusting a supplied request ID", async () => {
    const app = await buildApp(environment, { identityProvider: { getUser: async () => user, revokeSessions } });
    try {
      const reference = randomUUID();
      const first = await app.inject({ url: "/v1/auth/me", headers: { cookie: "synthetic=private", "x-request-id": "untrusted", "x-correlation-id": reference } });
      const second = await app.inject({ url: "/v1/auth/me", headers: { cookie: "synthetic=private", "x-correlation-id": "untrusted" } });
      expect(first.statusCode).toBe(200);
      expect(first.headers["x-correlation-id"]).toBe(reference);
      expect(first.headers["x-request-id"]).toMatch(/^[a-f0-9-]{36}$/);
      expect(second.headers["x-correlation-id"]).toBe(second.headers["x-request-id"]);
      expect(second.headers["x-request-id"]).not.toBe(first.headers["x-request-id"]);
      expect(first.headers["cache-control"]).toBe("private, no-store");
      expect(first.body).not.toContain("private");
    } finally { await app.close(); }
  });

  it.each(["identity", "roles", "validation"])("returns a recoverable failure for %s without replacing the session or inventing roles", async stage => {
    const app = await buildApp(environment, {
      identityProvider: { getUser: async () => { if (stage === "identity") throw new Error("private detail"); return stage === "validation" ? { ...user, email: "invalid" } : user; }, revokeSessions },
      roleManagementProvider: { getRoles: async () => { if (stage === "roles") throw new Error("private detail"); return []; } } as unknown as RoleManagementProvider,
    });
    try {
      const response = await app.inject({ url: "/v1/auth/me", headers: { cookie: "synthetic=private" } });
      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual({ error: "identity_unavailable" });
      expect(response.headers["set-cookie"]).toBeUndefined();
      expect(response.headers["x-request-id"]).toMatch(/^[a-f0-9-]{36}$/);
    } finally { await app.close(); }
  });
});
