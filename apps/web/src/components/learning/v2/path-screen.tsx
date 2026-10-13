import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowsClockwise, CaretDown, Clock, Play } from "@phosphor-icons/react/dist/ssr";
import { covers, stateMatches, type V2Path, type V2State } from "./model";
import { safeMapReturnHref } from "../map/map-route";
import { RouteSignals } from "./signals";
import { RouteAction } from "./route-action";
import { RouteMaintenance } from "./review";
import { V2Upgrade } from "./upgrade";
import styles from "./path-screen.module.css";
import { RouteContent } from "./route-content";
import { recommendationTitle } from "./curriculum-model";
import { RouteReason } from "./route-reason";

export function RouteNextStep({ path, state, returnTo }: { path: V2Path; state: V2State | null; returnTo?: string | null }) {
  const kind = state?.nextAction.kind;
  const recommendation = state ? recommendationTitle(path, state) : null;
  const paused = path.availability === "maintenance" || state?.availability === "maintenance";
  const title = paused ? "Ruta en mantenimiento" : path.access === "revoked" ? "Acceso no disponible" : path.enrollmentId && !state ? "Estado por confirmar" : kind === "review" || kind === "retention" ? "Es momento de repasar"
    : kind === "remediate" ? "Refuerza lo aprendido" : kind === "resume" ? "Retoma tu sesión"
      : kind === "gate" ? "Comprueba lo aprendido" : kind === "none" ? "Tu siguiente paso"
        : path.access === "available" ? "Comienza tu ruta" : recommendation?.title ?? "Continúa aprendiendo";
  const Icon = kind === "review" || kind === "retention" ? ArrowsClockwise : kind === "resume" || paused ? Clock : Play;
  return <section className={styles.nextStep} aria-label="Acción recomendada">
    <div className={styles.nextStepHeading}><span className={styles.actionIcon}><Icon size={22} aria-hidden /></span><h2>{title}</h2></div>
    {recommendation?.unit ? <p className={styles.actionUnit}>{recommendation.unit.title}</p> : null}
    <RouteAction path={path} state={state} returnTo={returnTo} showReason={false} />
    {paused ? <p>La práctica está pausada. Tu historial se conserva.</p> : state?.nextAction.kind === "none" ? <p><RouteReason reason={state.nextAction.reason} timeZone={state.maintenance?.timeZone} /></p> : state ? <details className={styles.reason}><summary>Ver recomendación <CaretDown size={14} aria-hidden /></summary><p><RouteReason reason={state.nextAction.reason} timeZone={state.maintenance?.timeZone} /></p></details> : null}
  </section>;
}

export function V2PathScreen({ path, state, focusUnit, returnTo }: { path: V2Path; state: V2State | null; focusUnit?: string; returnTo?: string | null }) {
  const confirmed = stateMatches(path, state) ? state : null;
  const safe = safeMapReturnHref(returnTo);
  return <article className={`learning-main learning-path-detail ${styles.screen}`} data-engine-version="guided-v2">
    <Link className={styles.back} href={safe ?? "/aprendizaje?tab=rutas"}><ArrowLeft aria-hidden size={18} />{safe ? "Volver al mapa" : "Todas las rutas"}</Link>
    <header className={styles.header}>
      <div className={styles.heading}><h1>{path.title}</h1><div className={styles.metadata}><span>{path.topicLabel}</span><span>{path.units.length} unidades</span></div>
        <details className={styles.about}><summary>Acerca de esta ruta <CaretDown size={14} aria-hidden /></summary><p>{path.summary}</p></details>
      </div>
      <div className={styles.cover}><Image alt="" fill priority sizes="(max-width: 600px) 88px, 144px" src={covers[path.coverKey]} /></div>
    </header>
    <div className={styles.overview}>
      <RouteNextStep path={path} state={confirmed} returnTo={safe} />
      {confirmed ? <section className={styles.progress} aria-label="Tu progreso"><h2>Tu progreso</h2><RouteSignals state={confirmed} appearance="overview" /></section> : null}
    </div>
    <section className={styles.units} aria-labelledby="v2-units-title"><div className={styles.sectionHeading}><h2 id="v2-units-title">Unidades de la ruta</h2><span>{path.units.length}</span></div>
      <RouteContent path={path} state={confirmed} focusUnit={focusUnit} returnTo={safe} />
    </section>
    {confirmed ? <>
      {confirmed.availability !== "maintenance" ? <details className={styles.versions}><summary><h2>Repaso y comprobaciones</h2><CaretDown size={18} aria-hidden /></summary><div className={styles.versionBody}><RouteMaintenance path={path} state={confirmed} /></div></details> : null}
      <details className={styles.versions}><summary><h2>Versiones e historial</h2><CaretDown size={18} aria-hidden /></summary><div className={styles.versionBody}>
        <V2Upgrade key={`${confirmed.enrollmentId}:${confirmed.rowVersion}`} enrollmentId={confirmed.enrollmentId} expectedVersion={confirmed.rowVersion} disabled={path.availability === "maintenance" || confirmed.availability === "maintenance"} />
        {confirmed.versionHistory?.length ? <section className={styles.history} aria-label="Historial de versiones"><h3>Tu historial</h3><ul>{confirmed.versionHistory.map(item => <li key={item.versionNumber}>Versión {item.versionNumber}{item.completedAt ? " · Finalización conservada" : ""}{item.consumedActivities.length ? <details><summary>Lecturas previas</summary><ul aria-label="Lecturas previas">{item.consumedActivities.map((title, index) => <li key={index}>{title} · Consumo previo</li>)}</ul></details> : null}</li>)}</ul></section> : null}
      </div></details>
    </> : path.availability === "maintenance" ? <p role="status">Ruta en mantenimiento. Tu historial se conserva.</p> : null}
  </article>;
}
