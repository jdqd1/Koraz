import { LearningHomeScreen } from "@/components/learning/learning-home-screen";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/current-user";
import { getLearningHome, getLearningProgress, getLearningV2Home } from "@/lib/server/guided-learning-api";
import { getLearningOverview } from "@/lib/server/learning-overview";
import { isV2Card } from "@/components/learning/v2/model";

export const dynamic = "force-dynamic";

export default async function LearningPage({ searchParams }: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const requested = (await searchParams).tab;
  const current = await getCurrentUser();
  if (!requested && current.status === "authenticated" && current.features.guidedLearning && current.features.guidedLearningMap) redirect("/aprendizaje/mapa");
  const tab = requested === "rutas" || requested === "progreso" ? requested : "hoy";
  const [overview, homeResult, v2HomeResult] = await Promise.all([getLearningOverview(),
    tab !== "rutas" ? getLearningHome() : null, tab === "hoy" ? getLearningV2Home() : null]);
  const paths = overview.paths;
  const v2States = overview.v2Routes.flatMap(route => route.state ? [route.state] : []);
  const progress = tab === "progreso" ? (await Promise.all(paths.flatMap((path) =>
    !isV2Card(path) && path.enrollment && path.enrollment.status !== "archived"
      ? [getLearningProgress(path.enrollment.id)]
      : []))).flatMap((entry) => entry.status === "ready" ? [entry.progress] : []) : [];
  return <LearningHomeScreen
    available={!overview.v1Unavailable && !overview.v2Unavailable}
    v1Unavailable={overview.v1Unavailable}
    home={homeResult?.status === "ready" ? homeResult.home : null}
    homeAvailable={homeResult?.status === "ready"}
    paths={paths}
    progress={progress}
    tab={tab}
    v2Home={v2HomeResult?.status === "ready" ? v2HomeResult.value : null}
    v2States={v2States}
    v2Unavailable={overview.v2Unavailable || v2HomeResult?.status === "unavailable"}
  />;
}
