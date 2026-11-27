import Link from "next/link";
import { notFound } from "next/navigation";
import { AutomaticPageRetry } from "@/components/automatic-page-retry";
import { LearningPathScreen } from "@/components/learning/learning-path-screen";
import { getLearningProgress, getLearningUpgradePreview, getLearningV2State } from "@/lib/server/guided-learning-api";
import { getPathForEngine } from "@/components/learning/v2/server";
import { V2PathScreen } from "@/components/learning/v2/path-screen";
import { V2Upgrade } from "@/components/learning/v2/upgrade";
import { resolveLearningContext, type LearningRouteQuery } from "@/lib/learning-navigation";

export const dynamic = "force-dynamic";

export default async function LearningPathPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<LearningRouteQuery> }) {
  const { slug } = await params;
  const query = await searchParams;
  const result = await getPathForEngine(slug);
  if (result.status === "not_found") notFound();
  if (result.status !== "ready") {
    return <main className="learning-main"><section className="learning-empty" role="alert">
      <div>
        <h1>No pudimos abrir esta ruta</h1>
        <p>{result.status === "forbidden" ? "Tu cuenta no tiene acceso a esta ruta." : result.status === "unauthorized" ? "Vuelve a iniciar sesión con la misma cuenta." : "Tu progreso se conserva. Puedes reintentar en el mismo lugar."}</p>
        {result.status === "unavailable" ? <AutomaticPageRetry /> : null}
      </div>
      {result.status === "forbidden" ? <Link className="learning-secondary-button" href="/aprendizaje?tab=rutas">Volver a las rutas</Link> : <a className="learning-secondary-button" href="">Reintentar</a>}
    </section></main>;
  }
  if (result.engineVersion === "guided-v2") {
    const state = result.path.enrollmentId ? await getLearningV2State(result.path.enrollmentId) : null;
    const { context, notice } = resolveLearningContext(query, result.path.units.map(unit => ({ key: unit.key, objectives: unit.objectives.map(objective => objective.key), activities: unit.activities?.map(activity => ({ key: activity.key, objective: activity.objectiveKey })) ?? [] })));
    return <V2PathScreen path={result.path} state={state?.status === "ready" ? state.value.state : null} focusUnit={context.unit} returnTo={context.origin} context={context} notice={notice} />;
  }
  const [progress, upgrade] = result.path.enrollment
    ? await Promise.all([
      getLearningProgress(result.path.enrollment.id, true),
      getLearningUpgradePreview(result.path.enrollment.id),
    ])
    : [null, null];
  const { context, notice } = resolveLearningContext(query, result.path.version.units.map(unit => ({ key: unit.stableKey, objectives: unit.objectives.map(objective => objective.id), activities: unit.steps.map(step => ({ key: step.id, objective: step.objectiveIds[0] })) })));
  return <><LearningPathScreen path={result.path} progress={progress?.status === "ready" ? progress.progress : null} upgrade={upgrade?.status === "ready" ? upgrade : null} focusUnit={context.unit} context={context} notice={notice} />
    {result.path.enrollment && upgrade?.status === "unavailable" ? <div className="learning-main"><V2Upgrade enrollmentId={result.path.enrollment.id} expectedVersion={result.path.enrollment.rowVersion} /></div> : null}</>;
}
