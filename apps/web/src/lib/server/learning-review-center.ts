import "server-only";
import { getLearningHome, getLearningV2Paths, getLearningV2Path, getLearningV2State } from "./guided-learning-api";
import type { V2Card } from "@/components/learning/v2/model";

export async function getReviewRoutes() {
  const cards = new Map<string, V2Card>();
  const seen = new Set<string>();
  let cursor: string | undefined;
  let unavailable = false;
  do {
    const result = await getLearningV2Paths(cursor);
    if (result.status !== "ready") { unavailable = true; break; }
    for (const card of result.value.items) if (card.enrollmentId) cards.set(card.id, card);
    cursor = result.value.nextCursor ?? undefined;
    if (cursor && seen.has(cursor)) { unavailable = true; break; }
    if (cursor) seen.add(cursor);
  } while (cursor);
  const routes = await Promise.all([...cards.values()].map(async card => {
    const [path, state] = await Promise.all([getLearningV2Path(card.slug), getLearningV2State(card.enrollmentId!)]);
    return { card, path: path.status === "ready" ? path.value.path : null,
      state: state.status === "ready" ? state.value.state : null };
  }));
  return { routes, unavailable };
}

export async function getLearningReviewCenter(minutes: 5 | 10 | 20) {
  const [legacy, objectives] = await Promise.all([getLearningHome(minutes), getReviewRoutes()]);
  return { home: legacy.status === "ready" ? legacy.home : null, ...objectives };
}
