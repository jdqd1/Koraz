"use client";
import { useEffect, useState } from "react";
import { V2AttemptManifestSchema, V2PublicActivitySchema } from "@cediah/contracts";
import type { V2AttemptManifest, V2RouteState } from "@cediah/contracts";
import { fixtureId, studentFixture } from "./fixtures";
import { createV2Launcher, createV2Reader } from "./client";
import { V2Player } from "./player";

/** Public synthetic data for development QA, without client-side solutions. */
export function playerFixture(kind = "study") {
  const fixture = studentFixture();
  const base = { key: "practice-a", objectiveKey: "objective-a", phase: kind === "study" ? "learn" : "retrieve", representation: "text", prompt: kind === "study" ? "Comprende la relación entre A y B" : kind === "constructed_response" ? "Explica cómo se relacionan A y B" : "Recupera la relación entre A y B" };
  const activeActivity = V2PublicActivitySchema.parse({ ...base, kind, payload: kind === "study" ? { body: "EXPLICACION_PREVIA: A precede a B en este ejemplo sintético.", focusSpans: [{ start: 20, end: 32 }], assetKey: null, scaffold: "explanation", videoRange: null } : kind === "single_choice" ? { options: [{ key: "a", text: "A precede a B" }, { key: "b", text: "B precede a A" }] } : { maxChars: kind === "short_answer" ? 120 : 4000 } });
  return { ...fixture, attempt: V2AttemptManifestSchema.parse({ ...fixture.attempt, activeActivity }) };
}
export function PlayerFixture({ mode }: { mode: string }) {
  const [initial, setInitial] = useState<V2AttemptManifest | null>(null);
  const [state, setState] = useState<V2RouteState | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    createV2Launcher().resume(fixtureId(4)).then(async result => {
      const confirmedState = await createV2Reader().state(result.attempt.enrollmentId).catch(() => null);
      if (live) { setState(confirmedState); setInitial(result.attempt); }
    }).catch(() => { if (live) setError(true); });
    return () => { live = false; };
  }, [mode]);
  if (error) return <p role="alert">El fixture requiere mocks HTTP tipados; no usa datos como fallback.</p>;
  if (!initial) return <p role="status">Cargando manifiesto confirmado de prueba…</p>;
  return <V2Player initialAttempt={initial} initialState={state} />;
}
