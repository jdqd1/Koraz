import "server-only";
import {
  V2HttpContracts,
  V2CatalogResponseSchema,
  V2HomeSnapshotSchema,
  LearningAttemptSchema,
  LearningEditorPathListResponseSchema,
  LearningEditorResourceCatalogResponseSchema,
  LearningEnrollmentProgressSchema,
  LearningEnrollmentUpgradePreviewResponseSchema,
  LearningHomeSchema,
  LearningLibraryOptionsResponseSchema,
  LearningPathCatalogResponseSchema,
  LearningPathDetailSchema,
  type LearningAttempt,
  type LearningEnrollmentProgress,
  type LearningEnrollmentUpgradePreviewResponse,
  type LearningEditorResourceCatalogResponse,
  type LearningHome,
  type LearningLibraryOption,
  type LearningPathCard,
  type LearningPathDetail,
} from "@cediah/contracts";
import { getApiRequestCookie } from "./api-session";
import { requestContentApi } from "./content-api";

export type LearningCatalogResult =
  | { items: LearningPathCard[]; nextCursor: string | null; status: "ready" }
  | { status: "unauthorized" | "unavailable" };
export type LearningPathResult =
  | { path: LearningPathDetail; status: "ready" }
  | { status: "not_found" | "unauthorized" | "unavailable" };
export type LearningEditorWorkspaceResult =
  | { items: LearningPathDetail[]; status: "ready" }
  | { status: "forbidden" | "unauthorized" | "unavailable" };
export type LearningEditorResourceResult =
  | ({ status: "ready" } & LearningEditorResourceCatalogResponse)
  | { status: "forbidden" | "unauthorized" | "unavailable" };
export type LearningUpgradePreviewResult =
  | ({ status: "ready" } & LearningEnrollmentUpgradePreviewResponse)
  | { status: "not_found" | "unauthorized" | "unavailable" };
export type LearningAttemptResult =
  | { attempt: LearningAttempt; status: "ready" }
  | { status: "not_found" | "unauthorized" | "unavailable" };
export type LearningProgressResult =
  | { progress: LearningEnrollmentProgress; status: "ready" }
  | { status: "not_found" | "unauthorized" | "unavailable" };
export type LearningLibraryOptionsResult =
  | { items: LearningLibraryOption[]; status: "ready" }
  | { status: "unauthorized" | "unavailable" };
export type LearningHomeResult =
  | { home: LearningHome; status: "ready" }
  | { status: "unauthorized" | "unavailable" };

async function sessionRequest(path: string) {
  const session = await getApiRequestCookie();
  if (session.status === "anonymous") return { body: null, status: 401 };
  return requestContentApi({ cookie: session.cookie, method: "GET", path });
}

/** Explicit v2 transport. Existing strict v1 callers retain their original DTO. */
async function readGuidedV2<T>(path: string, schema: { safeParse(value: unknown): { success: true; data: T } | { success: false } }) {
  const response = await sessionRequest(path);
  if (response.status === 401) return { status: "unauthorized" as const };
  if (response.status === 403) return { status: "forbidden" as const };
  if (response.status === 404) return { status: "not_found" as const };
  if (response.status !== 200) return { status: "unavailable" as const };
  const parsed = schema.safeParse(response.body);
  return parsed.success ? { status: "ready" as const, value: parsed.data } : { status: "unavailable" as const };
}
export function getLearningV2Paths() { return readGuidedV2("/v2/guided-learning/paths?limit=20", V2CatalogResponseSchema); }
export function getLearningV2Home() { return readGuidedV2("/v2/guided-learning/home", V2HomeSnapshotSchema); }
export function getLearningV2Path(slug: string) {
  return readGuidedV2(`/v2/guided-learning/paths/${encodeURIComponent(slug)}`, V2HttpContracts.publicPath.response);
}
export function getLearningV2State(enrollmentId: string) {
  return readGuidedV2(`/v2/guided-learning/enrollments/${encodeURIComponent(enrollmentId)}/state`, V2HttpContracts.enrollmentState.response);
}
export function getLearningV2Attempt(attemptId: string) {
  return readGuidedV2(`/v2/guided-learning/attempts/${encodeURIComponent(attemptId)}`, V2HttpContracts.attemptGet.response);
}

type V2Card = Extract<Awaited<ReturnType<typeof getLearningV2Paths>>, { status: "ready" }>["value"]["items"][number];
export type LearningPathByEngine = { engineVersion: "guided-v1"; path: LearningPathCard } | { engineVersion: "guided-v2"; path: V2Card };
/** New consumers dispatch explicitly; enrolled versions win if both catalogs mention a route. */
export async function getLearningCatalogByEngine() {
  const [v1, v2] = await Promise.all([getLearningPaths(), getLearningV2Paths()]);
  if (v1.status !== "ready") return v1;
  if (v2.status === "unauthorized" || v2.status === "unavailable") return { status: v2.status };
  const items: LearningPathByEngine[] = v1.items.map((path) => ({ engineVersion: "guided-v1", path }));
  if (v2.status === "ready") for (const path of v2.value.items) {
    const index = items.findIndex((item) => item.path.id === path.id);
    if (index < 0) items.push({ engineVersion: "guided-v2", path });
    else {
      const previous = items[index]!;
      if (path.enrollmentId || previous.engineVersion !== "guided-v1" || !previous.path.enrollment) items[index] = { engineVersion: "guided-v2", path };
    }
  }
  return { status: "ready" as const, items, cursors: { v1: v1.nextCursor, v2: v2.status === "ready" ? v2.value.nextCursor : null } };
}
export async function getLearningHomeByEngine(minutes?: 5 | 10 | 20) {
  const [v1, v2] = await Promise.all([getLearningHome(minutes), getLearningV2Home()]);
  if (v1.status !== "ready") return v1;
  if (v2.status === "unauthorized" || v2.status === "unavailable") return { status: v2.status };
  return { status: "ready" as const, v1: { engineVersion: "guided-v1" as const, home: v1.home },
    v2: v2.status === "ready" ? { engineVersion: "guided-v2" as const, home: v2.value } : null };
}

export async function getLearningPaths(): Promise<LearningCatalogResult> {
  const response = await sessionRequest("/v1/guided-learning/paths?limit=20");
  if (response.status === 401) return { status: "unauthorized" };
  if (response.status !== 200) return { status: "unavailable" };
  const parsed = LearningPathCatalogResponseSchema.safeParse(response.body);
  return parsed.success
    ? { ...parsed.data, status: "ready" }
    : { status: "unavailable" };
}

export async function getLearningHome(minutes?: 5 | 10 | 20): Promise<LearningHomeResult> {
  const suffix = minutes ? `?minutes=${minutes}` : "";
  const response = await sessionRequest(`/v1/guided-learning/home${suffix}`);
  if (response.status === 401) return { status: "unauthorized" };
  if (response.status !== 200) return { status: "unavailable" };
  const parsed = LearningHomeSchema.safeParse(response.body);
  return parsed.success ? { home: parsed.data, status: "ready" } : { status: "unavailable" };
}

export async function getLearningPath(slug: string): Promise<LearningPathResult> {
  const response = await sessionRequest(`/v1/guided-learning/paths/${encodeURIComponent(slug)}`);
  if (response.status === 401) return { status: "unauthorized" };
  if (response.status === 404) return { status: "not_found" };
  if (response.status !== 200) return { status: "unavailable" };
  const parsed = LearningPathDetailSchema.safeParse(response.body);
  return parsed.success
    ? { path: parsed.data, status: "ready" }
    : { status: "unavailable" };
}

export async function getLearningAttempt(attemptId: string): Promise<LearningAttemptResult> {
  const response = await sessionRequest(`/v1/guided-learning/attempts/${encodeURIComponent(attemptId)}`);
  if (response.status === 401) return { status: "unauthorized" };
  if (response.status === 404) return { status: "not_found" };
  if (response.status !== 200) return { status: "unavailable" };
  const parsed = LearningAttemptSchema.safeParse(response.body);
  return parsed.success ? { attempt: parsed.data, status: "ready" } : { status: "unavailable" };
}

export async function getLearningProgress(enrollmentId: string): Promise<LearningProgressResult> {
  const response = await sessionRequest(`/v1/guided-learning/enrollments/${encodeURIComponent(enrollmentId)}/progress`);
  if (response.status === 401) return { status: "unauthorized" };
  if (response.status === 404) return { status: "not_found" };
  if (response.status !== 200) return { status: "unavailable" };
  const parsed = LearningEnrollmentProgressSchema.safeParse(response.body);
  return parsed.success ? { progress: parsed.data, status: "ready" } : { status: "unavailable" };
}

export async function getLearningUpgradePreview(
  enrollmentId: string,
): Promise<LearningUpgradePreviewResult> {
  const response = await sessionRequest(
    `/v1/guided-learning/enrollments/${encodeURIComponent(enrollmentId)}/upgrade-preview`,
  );
  if (response.status === 401) return { status: "unauthorized" };
  if (response.status === 404) return { status: "not_found" };
  if (response.status !== 200) return { status: "unavailable" };
  const parsed = LearningEnrollmentUpgradePreviewResponseSchema.safeParse(response.body);
  return parsed.success ? { ...parsed.data, status: "ready" } : { status: "unavailable" };
}

export async function getLearningLibraryOptions(
  sourceContentId: string,
  projection: "flashcards" | "guide" | "quiz" | "video",
): Promise<LearningLibraryOptionsResult> {
  const query = new URLSearchParams({ projection, sourceContentId });
  const response = await sessionRequest(`/v1/guided-learning/library/options?${query.toString()}`);
  if (response.status === 401) return { status: "unauthorized" };
  if (response.status !== 200) return { status: "unavailable" };
  const parsed = LearningLibraryOptionsResponseSchema.safeParse(response.body);
  return parsed.success ? { items: parsed.data.items, status: "ready" } : { status: "unavailable" };
}

export async function getLearningEditorWorkspace(): Promise<LearningEditorWorkspaceResult> {
  const response = await sessionRequest("/v1/editor/learning-paths");
  if (response.status === 401) return { status: "unauthorized" };
  if (response.status === 403) return { status: "forbidden" };
  if (response.status !== 200) return { status: "unavailable" };
  const parsed = LearningEditorPathListResponseSchema.safeParse(response.body);
  return parsed.success
    ? { items: parsed.data.items, status: "ready" }
    : { status: "unavailable" };
}

export async function getLearningEditorPath(pathId: string): Promise<LearningPathResult> {
  const response = await sessionRequest(`/v1/editor/learning-paths/${encodeURIComponent(pathId)}`);
  if (response.status === 401) return { status: "unauthorized" };
  if (response.status === 404) return { status: "not_found" };
  if (response.status !== 200) return { status: "unavailable" };
  const parsed = LearningPathDetailSchema.safeParse(response.body);
  return parsed.success ? { path: parsed.data, status: "ready" } : { status: "unavailable" };
}

/** Editor-only dispatch. The existing strict learner/v1 helpers keep their DTOs. */
export async function getLearningEditorPathForEngine(pathId: string) {
  const response = await sessionRequest(`/v1/editor/learning-paths/${encodeURIComponent(pathId)}`);
  if (response.status === 401) return { status: "unauthorized" as const };
  if (response.status === 403) return { status: "forbidden" as const };
  if (response.status === 200) {
    const parsed = LearningPathDetailSchema.safeParse(response.body);
    return parsed.success ? { status: "ready" as const, path: parsed.data, engineVersion: "guided-v1" as const } : { status: "unavailable" as const };
  }
  if (response.status !== 409 || !response.body || typeof response.body !== "object" || !("error" in response.body) || response.body.error !== "engine_version_mismatch") return { status: response.status === 404 ? "not_found" as const : "unavailable" as const };
  const v2 = await readGuidedV2(`/v2/editor/learning-paths/${encodeURIComponent(pathId)}`, V2HttpContracts.editorGet.response);
  return v2.status === "ready" ? { status: "ready" as const, path: v2.value.route, engineVersion: "guided-v2" as const } : v2;
}

export async function getLearningEditorResources(input: {
  cursor?: string;
  limit?: number;
  projection?: "flashcards" | "guide" | "quiz" | "video";
  q?: string;
  topic?: string;
} = {}): Promise<LearningEditorResourceResult> {
  const query = new URLSearchParams({ limit: String(input.limit ?? 24) });
  if (input.cursor) query.set("cursor", input.cursor);
  if (input.projection) query.set("projection", input.projection);
  if (input.q) query.set("q", input.q);
  if (input.topic) query.set("topic", input.topic);
  const response = await sessionRequest(`/v1/editor/learning-resources?${query.toString()}`);
  if (response.status === 401) return { status: "unauthorized" };
  if (response.status === 403) return { status: "forbidden" };
  if (response.status !== 200) return { status: "unavailable" };
  const parsed = LearningEditorResourceCatalogResponseSchema.safeParse(response.body);
  return parsed.success ? { ...parsed.data, status: "ready" } : { status: "unavailable" };
}
