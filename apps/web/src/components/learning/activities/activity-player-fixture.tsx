"use client";

import { learningVisualProgress } from "../learning-visual-fixtures";
import { ActivityShell } from "./activity-shell";
import { legacyActivityFixture } from "./activity-player-fixtures";

export function LegacyActivityPlayerFixture({ mode }: { mode: string }) {
  return <ActivityShell key={mode} initialAttempt={legacyActivityFixture(mode)} initialProgress={learningVisualProgress} userId="activity-ui-fixture" returnHref="/aprendizaje/mapa" />;
}
