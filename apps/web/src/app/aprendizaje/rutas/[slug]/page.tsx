import Link from "next/link";
import { notFound } from "next/navigation";
import { LearningPathScreen } from "@/components/learning/learning-path-screen";
import { getLearningProgress, getLearningUpgradePreview, getLearningV2State } from "@/lib/server/guided-learning-api";
import { getPathForEngine } from "@/components/learning/v2/server";
import { V2PathScreen } from "@/components/learning/v2/path-screen";
import { safeMapReturnHref } from "@/components/learning/map/map-route";

export const dynamic = "force-dynamic";

export default async function LearningPathPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ leccion?: string; returnTo?: string }> }) {
  const { slug } = await params;
  const result = await getPathForEngine(slug);
  if (result.status === "not_found") notFound();
  if (result.status !== "ready") {
    return <main className="learning-main"><section className="learning-empty" role="alert"><div><h1>No pudimos abrir esta ruta</h1><p>Tu progreso no cambió. Intenta de nuevo cuando la conexión esté disponible.</p></div><Link className="learning-secondary-button" href={`/aprendizaje/rutas/${slug}`}>Reintentar</Link></section></main>;
  }
  const query = await searchParams;
  if (result.engineVersion === "guided-v2") {
    const state = result.path.enrollmentId ? await getLearningV2State(result.path.enrollmentId) : null;
    return <V2PathScreen path={result.path} state={state?.status === "ready" ? state.value.state : null} focusUnit={result.path.units.find(unit => unit.key === query.leccion)?.key} returnTo={safeMapReturnHref(query.returnTo)} />;
  }
  const [progress, upgrade] = result.path.enrollment
    ? await Promise.all([
      getLearningProgress(result.path.enrollment.id),
      getLearningUpgradePreview(result.path.enrollment.id),
    ])
    : [null, null];
  const requestedUnit = query.leccion;
  const focusUnit = result.path.version.units.find(unit => unit.stableKey === requestedUnit)?.stableKey;
  return <LearningPathScreen path={result.path} progress={progress?.status === "ready" ? progress.progress : null} upgrade={upgrade?.status === "ready" ? upgrade : null} focusUnit={focusUnit} />;
}
