import { ReviewLauncher } from "@/components/learning/review-launcher";
import Link from "next/link";
import { V2ReviewScreen } from "@/components/learning/v2/review";
import { getLearningV2Home, getLearningV2Path, getLearningV2State } from "@/lib/server/guided-learning-api";

export const dynamic = "force-dynamic";

export default async function LearningReviewPage({ searchParams }: {
  searchParams: Promise<{ minutos?: string; motor?: string; ruta?: string }>;
}) {
  const query = await searchParams;
  const requested = Number(query.minutos);
  const minutes = requested === 5 || requested === 20 ? requested : 10;
  if (query.motor === "guided-v2") {
    const result = query.ruta ? await getLearningV2Path(query.ruta) : null;
    if (!result || result.status !== "ready") return <main className="learning-main learning-empty" data-engine-version="guided-v2"><h1>Repaso por objetivos</h1><p role="alert">No pudimos cargar esta ruta para tu cuenta. Tu historial se conserva.</p><Link href="/aprendizaje?tab=rutas">Volver a las rutas</Link></main>;
    const path = result.value.path;
    const current = path.enrollmentId ? await getLearningV2State(path.enrollmentId) : null;
    return <V2ReviewScreen path={path} state={current?.status === "ready" ? current.value.state : null} />;
  }
  const home = await getLearningV2Home();
  const active = home.status === "ready" ? home.value.activePath : null;
  return <>{active ? <aside className="learning-main" aria-label="Repaso por objetivos"><Link href={`/aprendizaje/repaso?${new URLSearchParams({ motor: "guided-v2", ruta: active.slug })}`}>Práctica y mantenimiento · {active.title}</Link></aside> : null}<ReviewLauncher minutes={minutes} /></>;
}
