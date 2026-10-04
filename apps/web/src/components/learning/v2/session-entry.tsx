import { V2Player } from "./player";
import type { V2Attempt, V2State } from "./model";

/** Existing engine dispatcher mounts the T029 player without touching v1. */
export function V2SessionEntry({ attempt, state, returnTo }: { attempt: V2Attempt; state: V2State | null; returnTo?: string | null }) {
  return <V2Player key={attempt.attemptId} initialAttempt={attempt} initialState={state} returnTo={returnTo} />;
}
