import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CaretDown } from "@phosphor-icons/react/dist/ssr";
import { covers, routeHref, stateMatches, type V2Path, type V2State } from "./model";
import { safeMapReturnHref } from "../map/map-route";
import { RouteSignals, ObjectiveList } from "./signals";
import { RouteAction } from "./route-action";

export function V2PathScreen({ path, state, focusUnit, returnTo }: { path: V2Path; state: V2State | null; focusUnit?: string; returnTo?: string | null }) {
  const confirmed = stateMatches(path, state) ? state : null;
  const safe = safeMapReturnHref(returnTo);
  return <main className="learning-main learning-path-detail" data-engine-version="guided-v2">
    <Link className="learning-back-link" href={safe ?? "/aprendizaje?tab=rutas"}><ArrowLeft aria-hidden size={18} />{safe ? "Volver al mapa" : "Todas las rutas"}</Link>
    <section className="learning-path-hero"><div className="learning-path-hero-copy"><span className="learning-topic-label">{path.topicLabel}</span><h1>{path.title}</h1><p>{path.summary}</p><div className="learning-path-facts"><span>{path.units.length} unidades</span></div>
      {confirmed ? <RouteSignals state={confirmed} /> : null}<RouteAction path={path} state={confirmed} returnTo={safe} />
    </div><div className="learning-path-hero-image"><Image alt="" fill priority sizes="(max-width: 767px) 100vw, 420px" src={covers[path.coverKey]} /></div></section>
    <section className="learning-route-map" aria-labelledby="v2-units-title"><div className="learning-section-heading"><div><span>Mapa de la ruta</span><h2 id="v2-units-title">Qué aprenderás</h2></div><p>La práctica disponible depende de la evidencia confirmada de tus objetivos.</p></div>
      {path.units.length ? <div className="learning-unit-list">{path.units.map((unit, index) => <details className="learning-unit" key={unit.key} id={`leccion-${unit.key}`} open={focusUnit ? unit.key === focusUnit : index === 0}>
        <summary><span className="learning-unit-number">{index + 1}</span><span><small>Unidad {index + 1}</small><strong>{unit.title}</strong><em>{unit.objectives.length} {unit.objectives.length === 1 ? "objetivo" : "objetivos"}</em></span><CaretDown aria-hidden className="learning-unit-caret" size={20} /></summary>
        <div className="learning-objectives"><strong>Al terminar podrás</strong><ObjectiveList objectives={unit.objectives} state={confirmed} />{safe ? <Link href={routeHref(path.slug, unit.key, safe)}>Ver unidad en la ruta</Link> : null}</div>
      </details>)}</div> : <p role="status">Esta ruta no tiene unidades disponibles.</p>}
    </section>
  </main>;
}
