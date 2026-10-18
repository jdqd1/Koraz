import { ArrowRight, ArrowsClockwise, BookOpen, CaretDown, CaretRight, ChatText, Check, CheckCircle, Circle, ClipboardText, FileText, ImageSquare, LinkSimple, ListChecks, LockSimple, PencilSimple, SortAscending } from "@phosphor-icons/react/dist/ssr";
import { objectiveLabels, stateMatches, type V2Path, type V2State } from "./model";
import { activityFormats, activityTitle, actionLocation, unitActivityProgress, unitRecommendation, type CurriculumActivity, type V2Unit } from "./curriculum-model";
import { authorizedMaintenanceTarget, RouteAction } from "./route-action";
import { UnitObjectiveStatus } from "./signals";
import { MaintenanceDate } from "./maintenance";
import { ObjectivePlacement } from "./diagnostic";
import styles from "./curriculum.module.css";

const activityIcons = { study: BookOpen, single_choice: ListChecks, short_answer: ChatText, constructed_response: PencilSimple, match: LinkSimple, image_target: ImageSquare, sequence: SortAscending, case: ClipboardText };

export function RouteCurriculum({ path, state, focusUnit, unitOnly = false, returnTo }: { path: V2Path; state: V2State | null; focusUnit?: string; unitOnly?: boolean; returnTo?: string | null }) {
  const confirmed = stateMatches(path, state) ? state : null;
  const recommendedUnit = confirmed ? actionLocation(path, confirmed).unit?.key : null;
  const units = unitOnly ? path.units.filter(unit => unit.key === focusUnit) : path.units;
  if (!units.length) return <p className={styles.empty} role="status">Esta ruta no tiene unidades disponibles.</p>;
  return <div className={styles.curriculum}>
    {units.map((unit, index) => {
      const progress = unitActivityProgress(unit, confirmed);
      const recommendedKey = unitOnly ? unitRecommendation(path, confirmed, unit)?.key : confirmed?.nextAction.key;
      const content = <UnitActivities path={path} unit={unit} state={confirmed} returnTo={returnTo} recommendedKey={recommendedKey} />;
      if (unitOnly) return <div key={unit.key}>{content}</div>;
      return <details key={unit.key} id={`leccion-${unit.key}`} className={styles.unit} open={unit.key === (focusUnit ?? recommendedUnit ?? units[0]?.key)}>
        <summary><span className={styles.unitNumber} data-done={!!progress?.total && progress.completed + progress.covered === progress.total}>{progress?.total && progress.completed + progress.covered === progress.total ? <Check size={18} aria-hidden /> : index + 1}</span>
          <span className={styles.unitCopy}><strong>{unit.title}</strong><span className={styles.unitMeta}>{unit.activities ? <span>{unit.activities.length} actividades</span> : <span>{unit.objectives.length} objetivos</span>}<UnitObjectiveStatus objectives={unit.objectives} state={confirmed} /></span></span><CaretDown className={styles.caret} size={18} aria-hidden /></summary>
        <div className={styles.unitBody}>{progress?.total ? <div className={styles.unitProgress}><span>{progress.completed} de {progress.total} actividades completadas{progress.covered ? ` · ${progress.covered} ya cubiertas` : ""}</span><progress aria-label={`Actividades completadas de ${unit.title}`} value={progress.completed} max={progress.total} /></div> : null}{content}</div>
      </details>;
    })}
  </div>;
}

function UnitActivities({ path, unit, state, returnTo, recommendedKey }: { path: V2Path; unit: V2Unit; state: V2State | null; returnTo?: string | null; recommendedKey?: string | null }) {
  const progress = new Map(state?.activityProgress?.map(item => [item.key, item.status]));
  const paused = path.availability === "maintenance" || state?.availability === "maintenance";
  const gate = state?.maintenance?.gates.find(item => item.unitKey === unit.key);
  return <div className={styles.objectiveGroups}>{unit.objectives.map(objective => {
    const status = state?.objectives.find(item => item.objectiveKey === objective.key);
    const blocker = state?.maintenance?.blockers.find(item => item.objectiveKey === objective.key);
    const activities = unit.activities?.filter(activity => activity.objectiveKey === objective.key);
    const review = state?.maintenance?.reviewBatch.find(item => item.objectiveKey === objective.key);
    const exhausted = state?.maintenance?.exhaustedBanks.find(item => item.objectiveKey === objective.key);
    const upcoming = state?.maintenance?.agenda.find(item => item.objectiveKey === objective.key);
    const admission = state?.maintenance?.placements?.find(item => item.objectiveKey === objective.key);
    const entries = activities?.map((activity, index) => ({ activity, index }));
    const completedCount = entries?.filter(entry => progress.get(entry.activity.key) === "completed").length ?? 0;
    const coveredCount = entries?.filter(entry => progress.get(entry.activity.key) === "dispensed").length ?? 0;
    function activityRow({ activity, index }: { activity: CurriculumActivity; index: number }) {
      const target = { kind: "activity" as const, key: activity.key };
      const available = !!state && !paused && path.access === "enrolled" && authorizedMaintenanceTarget(state, target);
      const next = available && recommendedKey === activity.key;
      const consumed = progress.get(activity.key);
      const done = consumed === "completed" || consumed === "dispensed";
      const blocked = !done && !!blocker?.blockedBy.length;
      const label = next ? null : consumed === "completed" ? "Completada" : consumed === "dispensed" ? "Ya cubierta" : paused ? "Pausada" : available ? "Disponible" : blocked ? admission ? admission.status === "xp_required" ? `${admission.remainingXp} XP + diagnóstico` : "Diagnóstico o conocimientos previos" : "Más adelante" : (!state && path.enrollmentId) || (state && !state.activityProgress) ? "Estado por cargar" : null;
      const Icon = activityIcons[activity.kind];
      return <li className={styles.activity} key={activity.key} data-current={next} data-done={done} data-blocked={blocked} aria-current={next ? "step" : undefined}>
        <span className={styles.stepMarker} aria-hidden>{next ? <ArrowRight size={16} /> : done ? <Check size={15} /> : blocked ? <LockSimple size={14} /> : index + 1}</span>
        <div className={styles.activityBody}><div className={styles.activityHeading}><span className={styles.activityTypeIcon} role="img" aria-label={activityFormats[activity.kind]} title={activityFormats[activity.kind]}><Icon size={19} aria-hidden /></span><strong>{activityTitle(activity)}</strong>{!activity.required ? <span className={styles.optionalBadge}>Opcional</span> : null}{label ? <span className={styles.activityState}>{label}</span> : null}</div>
          {available && !next ? <RouteAction path={path} state={state} target={target} returnTo={returnTo} label="Abrir actividad" showReason={false} appearance="secondary" /> : null}
        </div>
      </li>;
    }
    return <section className={styles.objective} key={objective.key} aria-label={`Objetivo: ${objective.title}`}>
      <div className={styles.objectiveHeading} data-objective-heading><h3><span className={styles.objectiveLabel}>Objetivo:</span> {objective.title}</h3><span className={styles.objectiveBadge} data-label={status?.label}>{status ? objectiveLabels[status.label] : state ? "Por comprobar" : path.enrollmentId ? "Estado por cargar" : "Por aprender"}</span></div>
      {status?.criticalErrorOpen ? <p className={styles.notice}>Hay un concepto esencial por reforzar antes de continuar con las actividades que dependen de él.</p> : null}
      {status?.firstMasteredAt && status.label !== "mastered" ? <p className={styles.note}>Tu aprendizaje anterior se conserva. Ahora toca reforzarlo.</p> : null}
      {blocker?.blockedBy.length ? <details className={styles.help}><summary><LockSimple size={14} aria-hidden />Qué necesitas antes</summary><ul>{blocker.blockedBy.map(key => <li key={key}>{path.units.flatMap(item => item.objectives).find(item => item.key === key)?.title ?? "Completar el objetivo previo"}</li>)}</ul></details> : null}
      {state ? <ObjectivePlacement path={path} state={state} objectiveKey={objective.key} returnTo={returnTo} /> : null}
      {activities?.length ? <>
        {completedCount || coveredCount ? <p className={styles.completed}><CheckCircle size={16} aria-hidden /><span>{completedCount ? `${completedCount} ${completedCount === 1 ? "actividad completada" : "actividades completadas"}` : ""}{completedCount && coveredCount ? " · " : ""}{coveredCount ? `${coveredCount} ${coveredCount === 1 ? "ya cubierta" : "ya cubiertas"}` : ""}</span></p> : null}
        <ol className={styles.activityList} aria-label={`Actividades de ${objective.title}`}>{entries?.map(activityRow)}</ol>
      </> : <p className={styles.empty}>{activities ? "No hay actividades de práctica en este objetivo." : "Actualiza la ruta para consultar las actividades de este objetivo."}</p>}
      {review && state ? <div className={styles.review} data-current={!paused && recommendedKey === review.key}><ArrowsClockwise size={18} aria-hidden /><div><strong>Es momento de repasar</strong><span>Vuelve a practicar este objetivo para recordar lo aprendido.</span></div>{!paused && recommendedKey !== review.key ? <RouteAction path={path} state={state} target={{ kind: "review", key: review.key }} returnTo={returnTo} label="Repasar" showReason={false} appearance="secondary" /> : null}</div> : status?.reviewDue ? <span className={styles.reviewNote}><ArrowsClockwise size={15} aria-hidden />Tienes un repaso pendiente</span> : null}
      {upcoming && !review ? <p className={styles.note}><ArrowsClockwise size={16} aria-hidden />Vuelve a repasar <MaintenanceDate value={upcoming.dueAt} timeZone={state?.maintenance?.timeZone} relativeTo={state?.maintenance?.generatedAt} friendly /> para recordar lo aprendido.</p> : exhausted ? <p className={styles.note}>Podrás volver a comprobar lo que recuerdas <MaintenanceDate value={exhausted.availableAfter} timeZone={state?.maintenance?.timeZone} relativeTo={state?.maintenance?.generatedAt} friendly /> Mientras tanto, puedes seguir practicando.</p> : null}
      {status?.firstConsolidatedAt ? <p className={styles.reviewNote}><CheckCircle size={15} aria-hidden />Recordado en los repasos</p> : null}
    </section>;
  })}
  {gate ? <div className={styles.unitCheck} data-passed={gate.passed} data-current={!gate.passed && state?.nextAction.kind === "gate" && state.nextActionContext?.unitKey === unit.key}>{gate.passed ? <CheckCircle size={21} weight="fill" aria-hidden /> : <Circle size={21} aria-hidden />}<span><strong>{gate.passed ? "Ya demostraste lo que aprendiste" : "Pon a prueba lo que aprendiste"}</strong><span>{gate.passed ? "Resolviste la evaluación de esta unidad. Los repasos te ayudarán a recordarla con el tiempo." : "Al terminar las actividades, responde unas preguntas para ver qué recuerdas y qué conviene repasar."}</span></span></div> : null}
  </div>;
}

export function CurriculumResources({ path, focusUnit, unitOnly = false }: { path: V2Path; focusUnit?: string; unitOnly?: boolean }) {
  const units = unitOnly ? path.units.filter(unit => unit.key === focusUnit) : path.units;
  return <div className={styles.resources}>{units.map(unit => <section key={unit.key} aria-label={`Recursos de ${unit.title}`}>
    {!unitOnly ? <h3>{unit.title}</h3> : null}
    {unit.resources?.length ? <ul>{unit.resources.map(resource => <li key={resource.key}><span className={styles.resourceIcon}>{resource.url ? <LinkSimple size={20} aria-hidden /> : <BookOpen size={20} aria-hidden />}</span><div>
      {resource.url ? <a href={resource.url} target="_blank" rel="noreferrer">{resource.title}<ArrowRight size={14} aria-hidden /><span className={styles.srOnly}> (se abre en otra pestaña)</span></a> : <strong>{resource.title}</strong>}
      {resource.locator.heading || resource.locator.sectionPath.length || resource.locator.page ? <div className={styles.locator}><FileText size={15} aria-hidden /><div><ol className={styles.locatorPath} aria-label="Secciones de lectura">{[...new Set([...resource.locator.sectionPath, ...resource.locator.heading.split("/").map(part => part.trim())].filter(Boolean))].map((heading, index) => <li key={heading}>{index ? <CaretRight size={11} aria-hidden /> : null}<span>{heading}</span></li>)}</ol>{resource.locator.page ? <span className={styles.pageLabel}>Página {resource.locator.page}</span> : null}</div></div> : null}
      {resource.citation ? <details className={styles.sourceNote}><summary>Sobre esta fuente<CaretDown size={13} aria-hidden /></summary><p>{resource.citation}</p></details> : null}
    </div></li>)}</ul> : <p className={styles.empty}>{unit.resources ? "Esta unidad no tiene recursos de referencia asociados." : "Actualiza la ruta para consultar sus recursos."}</p>}
  </section>)}</div>;
}
