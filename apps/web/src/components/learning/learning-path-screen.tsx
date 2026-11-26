import Link from "next/link";
import { learningOptionUnderReview, type LearningEnrollmentProgress, type LearningEnrollmentUpgradePreviewResponse, type LearningPathDetail } from "@cediah/contracts";
import { BookOpen, CardsThree, CaretDown, CheckCircle, Exam, PlayCircle } from "@phosphor-icons/react/dist/ssr";
import { learningRouteHref, learningSessionHref, type LearningRouteContext } from "@/lib/learning-navigation";
import { LearningEnrollmentActions } from "./learning-enrollment-actions";
import { LearningPathUpgrade, type LearningPathUpgradeNotice } from "./learning-path-upgrade";
import { LearningStepPreference } from "./learning-step-preference";
import { LearningOptionAction } from "./learning-option-action";
import { RouteDetailLayout } from "./route-detail-layout";
import { RouteDetailContent } from "./route-detail-content";
import styles from "./v2/path-screen.module.css";
import curriculum from "./v2/curriculum.module.css";

const projectionLabels = { flashcards: "Tarjetas", guide: "Guía", quiz: "Cuestionario", video: "Video" } as const;
const projectionIcons = { flashcards: CardsThree, guide: BookOpen, quiz: Exam, video: PlayCircle } as const;
const evidenceLabels = { consolidated: "Consolidado", developing: "Bien encaminado", practicing: "En práctica", unassessed: "Por comprobar" } as const;

export function LearningPathScreen({ path, progress, upgrade, focusUnit, context = {}, notice }: {
  path: LearningPathDetail; progress: LearningEnrollmentProgress | null; upgrade: LearningEnrollmentUpgradePreviewResponse | null;
  focusUnit?: string; context?: LearningRouteContext; notice?: string | null;
}) {
  const units = path.version.units;
  const progressUnavailable = Boolean(path.enrollment && !progress);
  const minutes = units.flatMap(unit => unit.steps).reduce((sum, step) => {
    const option = step.options.find(option => option.isDefault) ?? step.options[0];
    return sum + (option?.estimatedMinutes ?? 0);
  }, 0);
  const progressByStep = new Map(progress?.units.flatMap(unit => unit.steps).map(step => [step.stepId, step]) ?? []);
  const progressByUnit = new Map(progress?.units.map(unit => [unit.id, unit]) ?? []);
  const currentUnit = units.find(unit => { const state = progressByUnit.get(unit.id); return !state || state.completedEssentialSteps < state.totalEssentialSteps; });
  let upgradeNotice: LearningPathUpgradeNotice | null = null;
  if (path.enrollment && upgrade?.upgrade) {
    const { steps, ...preview } = upgrade.upgrade;
    upgradeNotice = { changes: steps.filter(step => step.kind !== "equivalent"), enrollmentId: path.enrollment.id, expectedVersion: path.enrollment.rowVersion, historyCount: upgrade.history.length, preview };
  }
  const activities = <div className={curriculum.curriculum}>{units.map((unit, index) => {
    const unitProgress = progressByUnit.get(unit.id);
    const completed = !!unitProgress && unitProgress.totalEssentialSteps > 0 && unitProgress.completedEssentialSteps === unitProgress.totalEssentialSteps;
    return <details key={unit.id} data-unit-key={unit.stableKey} id={`leccion-${unit.stableKey}`} className={curriculum.unit} open={unit.stableKey === (focusUnit ?? currentUnit?.stableKey ?? units[0]?.stableKey)}>
      <summary tabIndex={0}><span className={curriculum.unitNumber} data-done={completed}>{completed ? <CheckCircle size={22} aria-hidden /> : index + 1}</span><span className={curriculum.unitCopy}><strong>{unit.title}</strong><span className={curriculum.unitMeta}>{unitProgress ? `${unitProgress.completedEssentialSteps}/${unitProgress.totalEssentialSteps} esenciales` : `${unit.steps.length} actividades`}</span></span><CaretDown className={curriculum.caret} size={18} aria-hidden /></summary>
      <div className={curriculum.unitBody}><div className="learning-objectives"><strong>Al terminar podrás</strong><ul>{unit.objectives.map(objective => {
        const evidence = unitProgress?.objectives.find(entry => entry.id === objective.id);
        return <li id={`objetivo-${objective.id}`} tabIndex={-1} key={objective.id}><span>{objective.title}</span>{evidence ? <small>{evidenceLabels[evidence.state]}{evidence.lastCheckPercent !== null ? ` · última comprobación ${evidence.lastCheckPercent}%` : ""}{evidence.evidenceLimited ? " · evidencia limitada por el banco disponible" : ""}</small> : null}</li>;
      })}</ul></div>
      <ol className="learning-step-list">{unit.steps.map(step => {
        const state = progressByStep.get(step.id);
        return <li id={`actividad-${step.id}`} tabIndex={-1} data-state={progressUnavailable ? undefined : state?.state ?? "not_started"} key={step.id}>
          <div className="learning-step-heading"><span>{state?.state === "completed" ? "Completada" : state?.state === "in_progress" ? "En progreso" : state?.state === "skipped" ? "Omitida, no completada" : step.isEssential ? "Esencial" : "Opcional"}</span><h3>{step.title}</h3>{path.enrollment && !progressUnavailable && state?.state !== "completed" ? <LearningStepPreference enrollmentId={path.enrollment.id} rowVersion={state?.rowVersion ?? 0} skipped={state?.state === "skipped"} stepId={step.id} /> : null}</div>
          {state?.state === "completed" && state.attemptId ? <Link className="learning-secondary-button" href={learningSessionHref(state.attemptId, learningRouteHref(path.slug, { ...context, unit: unit.stableKey, objective: step.objectiveIds[0], activity: step.id }))}>Consultar resultado</Link> : null}
          <div className="learning-option-list">{!step.options.length ? <p>Material no disponible.</p> : null}{step.options.map(option => {
            if (learningOptionUnderReview(option.id)) return <p key={option.id}>Material en revisión editorial.</p>;
            const Icon = projectionIcons[option.projection];
            const copy = <><span className="learning-option-icon"><Icon aria-hidden size={22} /></span><span><strong>{option.label}</strong><small>{projectionLabels[option.projection]}{option.estimatedMinutes ? ` · ${option.estimatedMinutes} min` : ""}{option.isDefault ? " · Recomendada" : " · Alternativa"}</small></span></>;
            const existingAttemptId = state?.openAttempts ? state.openAttempts.find(attempt => attempt.optionId === option.id)?.attemptId ?? null
              : state?.state === "completed" ? null : state?.attemptId ?? null;
            return path.enrollment?.status === "active" && !progressUnavailable ? <LearningOptionAction key={option.id} slug={path.slug} optionId={option.id} existingAttemptId={existingAttemptId} completed={state?.state === "completed"} context={{ ...context, unit: unit.stableKey, objective: step.objectiveIds[0], activity: step.id }}>{copy}</LearningOptionAction> : <div className="learning-option is-locked" key={option.id}>{copy}<em>{progressUnavailable ? "Recupera tu progreso para abrir la actividad" : "Comienza o reanuda la ruta"}</em></div>;
          })}</div>
        </li>;
      })}</ol></div>
    </details>;
  })}</div>;
  const resources = <div className={curriculum.resources}>{units.map(unit => <section key={unit.id} aria-label={`Recursos de ${unit.title}`}><h3>{unit.title}</h3><p>Consultar una lectura no cambia tus respuestas ni concede puntos. Los demás formatos están en Actividades.</p><ul>{unit.steps.flatMap(step => step.options.filter(option => option.projection === "guide" && !learningOptionUnderReview(option.id)).map(option => <li key={option.id}><BookOpen size={20} aria-hidden />{path.enrollment ? <Link href={`/aprendizaje/rutas/${encodeURIComponent(path.slug)}/recursos/${option.id}?${new URLSearchParams({ returnTo: learningRouteHref(path.slug, { ...context, unit: unit.stableKey, tab: "resources" }) })}`}>Consultar {option.label}</Link> : <span>{option.label} · Comienza la ruta para consultar</span>}</li>))}</ul></section>)}</div>;
  return <RouteDetailLayout title={path.title} summary={path.summary} topic={path.topic.title} coverKey={path.coverKey} unitCount={units.length} origin={context.origin} engine="guided-v1" overview={<>
    <section className={styles.nextStep} aria-label="Acción recomendada"><h2>Continúa tu ruta</h2><p>Elige una actividad{minutes > 0 ? ` · ${minutes} min orientativos` : ""}</p><LearningEnrollmentActions enrollment={path.enrollment} pathId={path.id} /></section>
    {progress ? <section className={styles.progress} aria-label="Tu progreso"><h2>Tu progreso</h2><p>{progress.completedEssentialSteps} de {progress.totalEssentialSteps} pasos esenciales</p><progress aria-label="Actividades esenciales completadas" max={progress.totalEssentialSteps} value={progress.completedEssentialSteps} /></section> : null}
  </>}>
    {notice ? <p role="status">{notice}</p> : null}
    {progressUnavailable ? <section className="learning-empty" role="alert"><div><h2>No pudimos cargar tu progreso</h2><p>Reintenta para recuperar las actividades guardadas.</p></div><a className="learning-secondary-button" href="">Reintentar progreso</a></section> : null}
    {upgradeNotice ? <LearningPathUpgrade notice={upgradeNotice} /> : null}
    <section className={styles.units} aria-labelledby="learning-units-title"><h2 className={styles.sectionHeading} id="learning-units-title">Unidades de la ruta</h2><RouteDetailContent slug={path.slug} context={context} activities={activities} resources={resources} /></section>
  </RouteDetailLayout>;
}
