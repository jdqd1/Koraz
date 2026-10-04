"use client";
import Link from "next/link";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { LearningHomeScreen } from "../learning-home-screen";
import { LearningMapWorkspace } from "../map/learning-map-workspace";
import { createV2MapClient } from "../map/v2-adapter";
import { studentFixture, fixtureMapBase } from "./fixtures";
import { V2PathScreen } from "./path-screen";
import { V2SessionEntry } from "./session-entry";
import { V2RequestError } from "./client";

export function StudentV2Fixture({ mode, surface }: { mode: string; surface: string }) {
  const fixture = useMemo(() => studentFixture(mode), [mode]);
  const client = useMemo(() => createV2MapClient(fixtureMapBase(mode), {
    async cards() { if (mode === "network") throw new V2RequestError(503); return mode === "empty" ? [] : [fixture.card]; },
    async path() { return fixture.path; }, async state() { if (mode === "missing") throw new V2RequestError(503); return fixture.state; },
  }), [mode, fixture]);
  const state = ["missing", "available", "empty", "revoked"].includes(mode) ? null : fixture.state;
  return <AppShell activeKey="learning" guidedLearningEnabled headerTitle="Aprendizaje guiado" mainClassName={surface === "map" ? "learning-map-main" : undefined} viewer={{ email: "t028@example.test" }}>
    <nav aria-label="Superficies de prueba" style={{ display: "flex", flexWrap: "wrap", gap: 12, padding: 12 }}>{["map", "route", "hoy", "rutas", "progreso", "session"].map(item => <Link key={item} href={`/visual-fixtures/aprendizaje-v2?surface=${item}&estado=${encodeURIComponent(mode)}`}>{item}</Link>)}</nav>
    {surface === "map" ? <LearningMapWorkspace key={mode} account="t028-fixture" client={client} /> : surface === "route" ? <V2PathScreen path={fixture.path} state={state} /> : surface === "session" ? <V2SessionEntry attempt={fixture.attempt} state={state} /> : <LearningHomeScreen available home={null} homeAvailable paths={mode === "empty" ? [] : [fixture.card]} progress={[]} tab={surface === "progreso" || surface === "rutas" ? surface : "hoy"} v2Home={fixture.home} v2States={state ? [state] : []} v2Unavailable={mode === "network"} />}
  </AppShell>;
}
