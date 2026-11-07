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
  | { status: "unavailable"; reason: "timeout" | "connection" | "service" | "invalid_response"; reference: string };

async function resolveCurrentUser(): Promise<CurrentUserResult> {
  const credentials = await getApiRequestCookie();
  if (credentials.status === "anonymous") return credentials;

  const response = await requestContentApi({
    cookie: credentials.cookie,
    method: "GET",
    path: "/v1/auth/me",
  });
  if (response.status === 401) return { status: "anonymous" };
  const parsed = CurrentUserResponseSchema.safeParse(response.body);
  if (response.status === 200 && parsed.success && !response.transportError) {
    return {
      features: parsed.data.features,
      roles: parsed.data.roles,
      status: "authenticated",
      user: parsed.data.user,
    };
  }
  const reason = response.transportError ?? (response.status === 200 ? "invalid_response" : "service");
  const reference = response.requestId ?? crypto.randomUUID();
  console.warn("auth/me unavailable", { reason, reference, status: response.status });
  return { status: "unavailable", reason, reference };
}

export const getCurrentUser = cache(resolveCurrentUser);

export async function currentUserIsAdministrator(): Promise<boolean> {
  const current = await getCurrentUser();
  if (current.status !== "authenticated") return false;
  return current.roles.includes("administrator");
}
