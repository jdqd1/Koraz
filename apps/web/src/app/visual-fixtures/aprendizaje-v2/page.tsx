import { Suspense } from "react";
import { notFound } from "next/navigation";
import { StudentV2Fixture } from "@/components/learning/v2/fixture-workspace";
import { PlayerFixture } from "@/components/learning/v2/player-fixture";
import { AppShell } from "@/components/app-shell";
export const dynamic = "force-dynamic";
export default async function StudentV2FixturePage({ searchParams }: { searchParams: Promise<{ estado?: string; surface?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const query = await searchParams;
  if (query.surface === "player") return <AppShell activeKey="learning" guidedLearningEnabled headerTitle="Aprendizaje guiado" viewer={{ email: "t029@example.test" }}><PlayerFixture mode={query.estado ?? "study"} /></AppShell>;
  return <Suspense fallback={<p role="status">Preparando prueba de aprendizaje…</p>}><StudentV2Fixture mode={query.estado ?? "ready"} surface={query.surface ?? "map"} /></Suspense>;
}
