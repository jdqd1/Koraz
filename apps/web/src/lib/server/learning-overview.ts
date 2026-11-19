import "server-only";
import { getLearningPaths, getLearningV2Paths, getLearningV2State } from "./guided-learning-api";
import { mergeCards, isV2Card, stateMatches, type RouteCard, type V2Card, type V2State } from "@/components/learning/v2/model";
import type { LearningPathCard } from "@cediah/contracts";

async function collectPages<T extends { id: string }>(read: (cursor?: string) => Promise<{
  items: T[]; nextCursor: string | null;
} | null>) {
  const items = new Map<string, T>();
  const seen = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = await read(cursor);
    if (!page) return { items: [...items.values()], unavailable: true };
    for (const item of page.items) items.set(item.id, item);
    cursor = page.nextCursor ?? undefined;
    if (cursor && seen.has(cursor)) return { items: [...items.values()], unavailable: true };
    if (cursor) seen.add(cursor);
  } while (cursor);
  return { items: [...items.values()], unavailable: false };
}

/** Request-local reads; no user state is held across requests or revisions. */
export async function getLearningOverview() {
  const embedded = new Set<string>(), states = new Map<string, V2State>();
  const [v1, v2] = await Promise.all([
    collectPages<LearningPathCard>(async cursor => {
      const result = await getLearningPaths(cursor);
      return result.status === "ready" ? result : null;
    }),
    collectPages<V2Card>(async cursor => {
      const result = await getLearningV2Paths(cursor, true);
      if (result.status === "ready" && result.value.states !== undefined) {
        for (const card of result.value.items) if (card.enrollmentId) embedded.add(card.enrollmentId);
        for (const state of result.value.states) states.set(state.enrollmentId, state);
      }
      // A disabled engine is a capability, not an empty successful response.
      return result.status === "ready" ? result.value : null;
    }),
  ]);
  const paths: RouteCard[] = mergeCards(v1.items, v2.items);
  const v2Routes = await Promise.all(paths.filter(isV2Card).filter(card => card.enrollmentId).map(async card => {
    if (embedded.has(card.enrollmentId!)) {
      const state = states.get(card.enrollmentId!);
      return { card, state: state && stateMatches(card, state) ? state : null };
    }
    const result = await getLearningV2State(card.enrollmentId!);
    const state = result.status === "ready" && stateMatches(card, result.value.state) ? result.value.state : null;
    return { card, state };
  }));
  return { paths, v2Routes, v1Unavailable: v1.unavailable, v2Unavailable: v2.unavailable };
}

export type LearningOverview = Awaited<ReturnType<typeof getLearningOverview>>;
