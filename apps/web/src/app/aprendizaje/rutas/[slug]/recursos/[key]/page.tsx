import Link from "next/link";
import { getLearningResource } from "@/lib/server/guided-learning-api";
import { learningRouteHref, safeLearningReturnHref } from "@/lib/learning-navigation";
import { LearningResourceReader } from "@/components/learning/resource-reader";

export const dynamic = "force-dynamic";
export default async function LearningResourcePage({ params, searchParams }: { params: Promise<{ slug: string; key: string }>; searchParams: Promise<{ returnTo?: string }> }) {
  const [{ slug, key }, query] = await Promise.all([params, searchParams]);
  const result = await getLearningResource(slug, key);
  const candidate = safeLearningReturnHref(query.returnTo);
  const back = candidate?.startsWith(`/aprendizaje/rutas/${slug}?`) ? candidate : learningRouteHref(slug, { tab: "resources" });
  return <main className="learning-main"><Link className="learning-back-link" href={back}>Volver a los recursos de la unidad</Link>
    {result.status === "ready" ? <><h1>{result.value.title}</h1><LearningResourceReader resource={result.value} /></> : <section className="learning-empty" role="alert"><h1>Lectura no disponible</h1><p>{result.status === "unavailable" ? "No pudimos cargar la lectura. Reintenta para volver a la misma sección." : "Esta revisión no está disponible con tu acceso actual."} Tu progreso se conserva.</p>{result.status === "unavailable" ? <a className="learning-secondary-button" href="">Reintentar lectura</a> : null}</section>}
  </main>;
}
