import Link from "next/link";
import { learningOptionUnderReview } from "@cediah/contracts";
import { notFound } from "next/navigation";
import { ActivityLauncher } from "@/components/learning/activity-launcher";
import { learningRouteHref, safeLearningOrigin } from "@/lib/learning-navigation";
import {
  getLearningAttempt,
  getLearningPath,
  getLearningProgress,
} from "@/lib/server/guided-learning-api";

export const dynamic = "force-dynamic";

export default async function LearningActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; stepId: string }>;
  searchParams: Promise<{ opcion?: string; returnTo?: string }>;
}) {
  const [{ slug, stepId }, query] = await Promise.all([params, searchParams]);
  const pathResult = await getLearningPath(slug);
  if (pathResult.status === "unavailable") return <main className="learning-main"><section className="learning-empty" role="alert"><div><h1>No pudimos cargar esta actividad</h1><p>Tu progreso se conserva. Reintenta para abrir la actividad.</p></div><a className="learning-secondary-button" href="">Reintentar</a></section></main>;
  if (pathResult.status !== "ready" || !pathResult.path.enrollment) notFound();
  const step = pathResult.path.version.units.flatMap((unit) => unit.steps)
    .find((entry) => entry.id === stepId);
  const option = step?.options.find((entry) => entry.id === query.opcion);
  if (!step || !option) notFound();
  const unit = pathResult.path.version.units.find(unit => unit.steps.some(item => item.id === step.id));
  const returnTo = learningRouteHref(slug, { unit: unit?.stableKey, objective: step.objectiveIds[0], activity: step.id, origin: safeLearningOrigin(query.returnTo) });
  if (learningOptionUnderReview(option.id)) return <main className="learning-main"><section className="learning-empty">
    <h1>Material en revisión editorial</h1><p>Esta actividad necesita un material que corresponda a la unidad.</p>
    <Link className="learning-secondary-button" href={returnTo}>Volver a la unidad</Link>
  </section></main>;

  const progressResult = await getLearningProgress(pathResult.path.enrollment.id);
  if (progressResult.status !== "ready") {
    return <main className="learning-main"><section className="learning-empty" role="alert"><div><h1>No pudimos confirmar tu progreso</h1><p>Reintenta para recuperar el último estado guardado.</p></div><a className="learning-secondary-button" href="">Reintentar</a></section></main>;
  }
  const progressStep = progressResult.progress.units.flatMap((unit) => unit.steps)
    .find((entry) => entry.stepId === step.id);
  let existingAttemptId: string | null = null;
  let completed = false;
  if (progressStep?.attemptId) {
    const attemptResult = await getLearningAttempt(progressStep.attemptId);
    if (attemptResult.status === "unavailable") return <main className="learning-main"><section className="learning-empty" role="alert"><div><h1>No pudimos recuperar el intento</h1><p>Reintenta para continuar con la actividad guardada.</p></div><a className="learning-secondary-button" href="">Reintentar</a></section></main>;
    if (attemptResult.status === "ready" && attemptResult.attempt.stepOptionId === option.id) {
      existingAttemptId = attemptResult.attempt.id;
      completed = attemptResult.attempt.status === "completed";
    }
  }
  return (
    <ActivityLauncher
      existingAttemptId={existingAttemptId}
      optionId={option.id}
      pathSlug={pathResult.path.slug}
      stepTitle={step.title}
      returnTo={returnTo}
      completed={completed}
    />
  );
}
