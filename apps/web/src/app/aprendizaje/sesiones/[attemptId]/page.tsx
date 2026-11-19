import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityShell } from "@/components/learning/activities/activity-shell";
import { getLearningProgress, getLearningV2State, getLearningV2Paths, getLearningV2Path } from "@/lib/server/guided-learning-api";
import { getAttemptForEngine } from "@/components/learning/v2/server";
import { V2SessionEntry } from "@/components/learning/v2/session-entry";
import { getCurrentUser } from "@/lib/server/current-user";
import { safeLearningReturnHref, learningRouteHref } from "@/lib/learning-navigation";

export const dynamic = "force-dynamic";

export default async function LearningSessionPage({ params, searchParams }: { params: Promise<{ attemptId: string }>; searchParams: Promise<{ returnTo?: string }> }) {
  const { attemptId } = await params;
  const returnHref = safeLearningReturnHref((await searchParams).returnTo) ?? undefined;
  const [attemptResult, current] = await Promise.all([getAttemptForEngine(attemptId), getCurrentUser()]);
  if (attemptResult.status === "not_found") notFound();
  if (attemptResult.status !== "ready" || current.status !== "authenticated") {
    return <main className="learning-main"><section className="learning-empty" role="alert"><div><h1>No pudimos recuperar la sesión</h1><p>{attemptResult.status === "forbidden" ? "Tu cuenta no tiene acceso a esta sesión." : "Reintenta para cargar el último estado confirmado."}</p></div>{attemptResult.status === "forbidden" ? <Link className="learning-secondary-button" href={returnHref ?? "/aprendizaje?tab=rutas"}>Volver</Link> : <a className="learning-secondary-button" href="">Reintentar</a>}</section></main>;
  }
  if (attemptResult.engineVersion === "guided-v2") {
    const state = await getLearningV2State(attemptResult.attempt.enrollmentId);
    let back = returnHref;
    if (!back || back.startsWith("/aprendizaje/mapa")) {
      const seen = new Set<string>(); let cursor: string | undefined;
      do {
        const catalog = await getLearningV2Paths(cursor);
        if (catalog.status !== "ready") break;
        const card = catalog.value.items.find(card => card.enrollmentId === attemptResult.attempt.enrollmentId && card.pathVersionId === attemptResult.attempt.pathVersionId);
        if (card) {
          const path = await getLearningV2Path(card.slug), activity = attemptResult.attempt.activeActivity;
          const unit = path.status === "ready" ? path.value.path.units.find(unit => unit.objectives.some(objective => objective.key === activity?.objectiveKey)) : null;
          back = learningRouteHref(card.slug, { unit: unit?.key, objective: activity?.objectiveKey, activity: unit?.activities?.some(item => item.key === activity?.key) ? activity?.key : undefined, origin: returnHref });
          break;
        }
        cursor = catalog.value.nextCursor ?? undefined;
        if (cursor && seen.has(cursor)) break;
        if (cursor) seen.add(cursor);
      } while (cursor);
    }
    return <V2SessionEntry attempt={attemptResult.attempt} state={state.status === "ready" ? state.value.state : null} returnTo={back} />;
  }
  const enrollmentId = attemptResult.attempt.enrollmentId;
  const progressResult = enrollmentId ? await getLearningProgress(enrollmentId) : null;
  if (enrollmentId && progressResult?.status !== "ready") {
    return <main className="learning-main"><section className="learning-empty" role="alert"><div><h1>No pudimos cargar el progreso</h1><p>La sesión está guardada, pero necesitamos el resumen del servidor antes de continuar.</p></div><a className="learning-secondary-button" href="">Reintentar</a></section></main>;
  }
  const fallback = attemptResult.attempt.pathSlug ? learningRouteHref(attemptResult.attempt.pathSlug, { activity: attemptResult.attempt.stepId ?? undefined, origin: returnHref }) : undefined;
  return <ActivityShell key={attemptId} initialAttempt={attemptResult.attempt} initialProgress={progressResult?.status === "ready" ? progressResult.progress : null} userId={current.user.id} returnHref={!returnHref || returnHref.startsWith("/aprendizaje/mapa") ? fallback ?? returnHref : returnHref} />;
}
