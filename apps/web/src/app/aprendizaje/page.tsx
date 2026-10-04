import { LearningHomeScreen } from "@/components/learning/learning-home-screen";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/current-user";
import { getLearningHome, getLearningPaths, getLearningProgress, getLearningV2Paths, getLearningV2Home, getLearningV2State } from "@/lib/server/guided-learning-api";
import { mergeCards, isV2Card } from "@/components/learning/v2/model";

export const dynamic = "force-dynamic";

export default async function LearningPage({ searchParams }: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const requested = (await searchParams).tab;
  const current = await getCurrentUser();
  if (!requested && current.status === "authenticated" && current.features.guidedLearning && current.features.guidedLearningMap) redirect("/aprendizaje/mapa");
  const tab = requested === "rutas" || requested === "progreso" ? requested : "hoy";
  const [result, homeResult, v2Result, v2HomeResult] = await Promise.all([getLearningPaths(), getLearningHome(), getLearningV2Paths(), getLearningV2Home()]);
  const paths = mergeCards(result.status === "ready" ? result.items : [], v2Result.status === "ready" ? v2Result.value.items : []);
  const v2States = (await Promise.all(paths.flatMap(path => isV2Card(path) && path.enrollmentId ? [getLearningV2State(path.enrollmentId)] : []))).flatMap(entry => entry.status === "ready" ? [entry.value.state] : []);
  const progress = tab === "progreso" ? (await Promise.all(paths.flatMap((path) =>
    !isV2Card(path) && path.enrollment && path.enrollment.status !== "archived"
      ? [getLearningProgress(path.enrollment.id)]
      : []))).flatMap((entry) => entry.status === "ready" ? [entry.progress] : []) : [];
  return <LearningHomeScreen
    available={result.status === "ready" || v2Result.status === "ready"}
    home={homeResult.status === "ready" ? homeResult.home : null}
    homeAvailable={homeResult.status === "ready"}
    paths={paths}
    progress={progress}
    tab={tab}
    v2Home={v2HomeResult.status === "ready" ? v2HomeResult.value : null}
    v2States={v2States}
    v2Unavailable={v2Result.status === "unavailable" || v2HomeResult.status === "unavailable"}
  />;
}
