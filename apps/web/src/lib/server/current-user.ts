import "server-only";
import {
  CurrentUserResponseSchema,
  type CurrentUser,
  type PlatformRole,
} from "@cediah/contracts";
import { cache } from "react";
import { getApiRequestCookie } from "./api-session";
import { requestContentApi } from "./content-api";

export type CurrentUserResult =
  | {
      features: { guidedLearning: boolean; guidedLearningMap?: boolean };
      roles: PlatformRole[];
      status: "authenticated";
      user: CurrentUser;
    }
  | { status: "anonymous" }
  | { status: "unavailable"; reason: "timeout" | "connection" | "service" | "invalid_response" | "forbidden"; reference: string; retryable: boolean };

async function resolveCurrentUser(): Promise<CurrentUserResult> {
  const credentials = await getApiRequestCookie();
  if (credentials.status === "anonymous") return credentials;

  const reference = crypto.randomUUID();
  for (let attempt = 1; attempt <= 2; attempt++) {
    const started = performance.now();
    const response = await requestContentApi({
      cookie: credentials.cookie, method: "GET", path: "/v1/auth/me", timeoutMs: 2_500,
      headers: { "x-correlation-id": reference },
    });
    const parsed = CurrentUserResponseSchema.safeParse(response.body);
    const reason = response.transportError ?? (response.status === 200 ? "invalid_response" : response.status === 403 ? "forbidden" : "service");
    const authenticated = response.status === 200 && parsed.success && !response.transportError;
    const anonymous = response.status === 401 && !response.transportError;
    const retryable = Boolean(response.transportError) || [502, 503, 504].includes(response.status);
    const observation = { reference, requestId: response.requestId, attempt, status: response.status,
      durationMs: Math.round(performance.now() - started), stage: response.transportError ? "transport" : response.status === 200 ? "validation" : "http",
      reason: authenticated ? "authenticated" : anonymous ? "anonymous" : reason };
    if (!authenticated && !anonymous) console.warn("auth/me unavailable", observation);
    else if (attempt > 1) console.info("auth/me resolved", observation);
    if (anonymous) return { status: "anonymous" };
    if (authenticated && parsed.success) return {
      features: parsed.data.features, roles: parsed.data.roles, status: "authenticated", user: parsed.data.user,
    };
    if (attempt === 1 && retryable) {
      await new Promise(resolve => setTimeout(resolve, 150));
      continue;
    }
    return { status: "unavailable", reason, reference, retryable };
  }
  return { status: "unavailable", reason: "service", reference, retryable: false };
}

export const getCurrentUser = cache(resolveCurrentUser);

export async function currentUserIsAdministrator(): Promise<boolean> {
  const current = await getCurrentUser();
  if (current.status !== "authenticated") return false;
  return current.roles.includes("administrator");
}
