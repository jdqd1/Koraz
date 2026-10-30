import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../../app/api/auth/[...path]/route";

vi.mock("@/lib/server/env", () => ({ getServerEnvironment: () => ({
  API_BASE_URL: "https://private-api.example", AUTH_PROXY_SECRET: "server-only-secret",
}) }));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("authentication proxy", () => {
  const context = { params: Promise.resolve({ path: ["sign-in", "email"] }) };
  it("preserves independent cookies and authenticates only server-provided metadata", async () => {
    vi.stubEnv("VERCEL", "1");
    const upstream = vi.fn(async () => {
      const headers = new Headers();
      headers.append("set-cookie", "a=one; HttpOnly; Secure");
      headers.append("set-cookie", "b=two; HttpOnly; Secure");
      return new Response("{}", { headers });
    });
    vi.stubGlobal("fetch", upstream);
    const result = await POST(new Request("https://web.example/api/auth/sign-in/email", {
      method: "POST", headers: { origin: "https://web.example", "content-type": "application/json",
        "x-auth-proxy-secret": "attacker", "x-forwarded-for": "fake", "x-vercel-forwarded-for": "192.0.2.1" }, body: "{}",
    }), context);
    expect(result.headers.getSetCookie()).toHaveLength(2);
    expect(result.headers.get("cache-control")).toBe("private, no-store");
    const options = upstream.mock.calls[0] as unknown as [URL, RequestInit];
    const headers = options[1].headers as Headers;
    expect(headers.get("x-auth-proxy-secret")).toBe("server-only-secret");
    expect(headers.get("x-forwarded-for")).toBe("192.0.2.1");
  });
  it("rejects cross-origin mutations before contacting the API", async () => {
    const upstream = vi.fn(); vi.stubGlobal("fetch", upstream);
    const result = await POST(new Request("https://web.example/api/auth/sign-out", {
      method: "POST", headers: { origin: "https://attacker.example" }, body: "{}",
    }), context);
    expect(result.status).toBe(403); expect(upstream).not.toHaveBeenCalled();
  });
  it("returns an unavailable response without deleting stored cookies on a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    const result = await POST(new Request("https://web.example/api/auth/sign-in/email", {
      method: "POST", headers: { origin: "https://web.example" }, body: "{}",
    }), context);
    expect(result.status).toBe(503); expect(result.headers.getSetCookie()).toHaveLength(0);
  });
});
