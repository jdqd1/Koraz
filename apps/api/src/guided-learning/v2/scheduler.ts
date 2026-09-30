import { guidedV2PolicySnapshot as policy } from "./service.js";

const day = 86400000;
export type ReviewResponseV2 = {
  responseId: string; sessionId: string; acceptedAt: string;
  gradingSource: "server" | "self" | "none"; score01: number | null; assisted: boolean;
  selfRating: "again" | "hard" | "good" | null;
  purpose: string; phase: string; valid: boolean;
};
export type ReviewStateV2 = {
  stage: number; lapses: number; dueAt: string; lastAppliedResponseId: string;
  lastExtendedAt: string | null; retention7DueAt: string | null; retention7AcceptedAt: string | null;
  retention30DueAt: string | null; retention30AcceptedAt: string | null;
};
const failure = (r: ReviewResponseV2) => r.gradingSource === "server" && r.score01 === 0 && !r.assisted
  || r.gradingSource === "self" && r.selfRating === "again";
const iso = (t: number) => new Date(t).toISOString();

/** Consumes accepted server receipts, never client time, confidence or speed. */
export function scheduleReviewV2(
  previous: ReviewStateV2 | null, response: ReviewResponseV2,
  history: readonly ReviewResponseV2[] = [], firstMasteredAt: string | null = null,
): ReviewStateV2 | null {
  if (!response.valid || ["diagnostic", "preview"].includes(response.purpose)
    || !["retrieve", "apply"].includes(response.phase)
    || response.gradingSource === "none" && !response.assisted) return previous;
  if (previous?.lastAppliedResponseId === response.responseId
    || history.some((r) => r.responseId === response.responseId)) return previous;
  const t = Date.parse(response.acceptedAt);
  if (!Number.isFinite(t)) throw new TypeError("Invalid accepted server timestamp");
  const state: ReviewStateV2 = previous ? { ...previous } : {
    stage: 0, lapses: 0, dueAt: iso(t + day), lastAppliedResponseId: response.responseId,
    lastExtendedAt: null, retention7DueAt: null, retention7AcceptedAt: null,
    retention30DueAt: null, retention30AcceptedAt: null,
  };
  if (firstMasteredAt && t >= Date.parse(firstMasteredAt)) {
    state.retention7DueAt ??= iso(Date.parse(firstMasteredAt) + policy.retention.firstDays * day);
    state.retention30DueAt ??= iso(Date.parse(firstMasteredAt) + policy.retention.secondDays * day);
  }
  const objective = response.gradingSource === "server" && !response.assisted && response.score01 !== null;
  if (objective && response.purpose === "retention7" && state.retention7DueAt
    && t >= Date.parse(state.retention7DueAt) && !state.retention7AcceptedAt) {
    state.retention7AcceptedAt = iso(t);
    state.retention30DueAt = iso(Math.max(Date.parse(state.retention30DueAt!),
      t + policy.retention.minSeparationDays * day));
  }
  if (objective && response.purpose === "retention30" && state.retention7AcceptedAt
    && state.retention30DueAt && t >= Date.parse(state.retention30DueAt)) state.retention30AcceptedAt ??= iso(t);
  const failures = history.filter((r) => r.valid && failure(r));
  if (failure(response)) {
    const retries = failures.filter((r) => r.sessionId === response.sessionId).length;
    state.dueAt = iso(t + (retries < policy.review.immediateRetryLimit ? policy.review.retryMinutes * 60000 : day));
    state.stage = 0;
    state.lapses += 1;
  } else if (response.gradingSource === "server" && response.score01 === 1 && !response.assisted) {
    const reinforcement = failures.some((r) => t - Date.parse(r.acceptedAt) < day);
    if (!reinforcement && (!state.lastExtendedAt || t - Date.parse(state.lastExtendedAt) >= day)) {
      state.dueAt = iso(t + policy.review.intervalsDays[state.stage]! * day);
      state.stage = Math.min(state.stage + 1, 4);
      state.lastExtendedAt = iso(t);
    }
  } else {
    // Assisted/partial/self-reported practice cannot postpone an active reinforcement.
    if (!failures.some((r) => t - Date.parse(r.acceptedAt) < day)) state.dueAt = iso(t + day);
  }
  state.lastAppliedResponseId = response.responseId;
  return state;
}

/** Absence is debt, never an invented failed response. Retention has priority. */
export function reviewDueV2(state: ReviewStateV2, now: Date) {
  const t = now.getTime();
  const retention7 = state.retention7DueAt && !state.retention7AcceptedAt && Date.parse(state.retention7DueAt) <= t;
  const retention30 = state.retention7AcceptedAt && state.retention30DueAt && !state.retention30AcceptedAt
    && Date.parse(state.retention30DueAt) <= t;
  const kind = retention7 ? "retention7" : retention30 ? "retention30" : Date.parse(state.dueAt) <= t ? "review" : null;
  const dueAt = kind === "retention7" ? state.retention7DueAt : kind === "retention30" ? state.retention30DueAt : state.dueAt;
  return { kind, dueAt, overdueMs: kind ? Math.max(0, t - Date.parse(dueAt!)) : 0 };
}
