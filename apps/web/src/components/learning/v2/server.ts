import "server-only";
import { LearningPathDetailSchema, LearningAttemptSchema } from "@cediah/contracts";
import { getApiRequestCookie } from "@/lib/server/api-session";
import { requestContentApi } from "@/lib/server/content-api";
import { getLearningV2Path, getLearningV2Attempt } from "@/lib/server/guided-learning-api";

async function legacy(path: string) {
  const session = await getApiRequestCookie();
  if (session.status === "anonymous") return { status: 401, body: null };
  return requestContentApi({ cookie: session.cookie, method: "GET", path });
}
function mismatch(body: unknown) {
  return !!body && typeof body === "object" && "error" in body && body.error === "engine_version_mismatch";
}
function errorStatus(status: number) { return status === 401 ? "unauthorized" as const : status === 403 ? "forbidden" as const : status === 404 ? "not_found" as const : "unavailable" as const; }
export async function getPathForEngine(slug: string) {
  const response = await legacy(`/v1/guided-learning/paths/${encodeURIComponent(slug)}`);
  if (response.status === 200) {
    const parsed = LearningPathDetailSchema.safeParse(response.body);
    return parsed.success ? { status: "ready" as const, engineVersion: "guided-v1" as const, path: parsed.data } : { status: "unavailable" as const };
  }
  // Legacy storage deliberately omits v2 rows (404); only a validated v2 read may dispatch them.
  if (response.status !== 404 && (response.status !== 409 || !mismatch(response.body))) return { status: errorStatus(response.status) };
  const v2 = await getLearningV2Path(slug);
  return v2.status === "ready" ? { status: "ready" as const, engineVersion: "guided-v2" as const, path: v2.value.path } : v2;
}
export async function getAttemptForEngine(id: string) {
  const response = await legacy(`/v1/guided-learning/attempts/${encodeURIComponent(id)}`);
  if (response.status === 200) {
    const parsed = LearningAttemptSchema.safeParse(response.body);
    return parsed.success ? { status: "ready" as const, engineVersion: "guided-v1" as const, attempt: parsed.data } : { status: "unavailable" as const };
  }
  if (response.status !== 404 && (response.status !== 409 || !mismatch(response.body))) return { status: errorStatus(response.status) };
  const v2 = await getLearningV2Attempt(id);
  return v2.status === "ready" ? { status: "ready" as const, engineVersion: "guided-v2" as const, attempt: v2.value.attempt } : v2;
}
