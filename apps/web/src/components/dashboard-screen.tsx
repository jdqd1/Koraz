import Link from "next/link";
import { ArrowRight, BookOpen } from "@phosphor-icons/react/dist/ssr";
import type { ContentItem, LearningHome } from "@cediah/contracts";
import { publishedContentHref } from "@/lib/content-navigation";
import { newestContentFirst } from "@/lib/content-order";
import { AppShell } from "./app-shell";
import { LearningDashboardReview } from "./learning/learning-dashboard-review";
import { LearningDashboardSummary } from "./learning/learning-dashboard-summary";

type Guide = Extract<ContentItem, { kind: "guide" }>;

function GuideCard({ guide }: { guide: Guide }) {
  return (
    <li>
      <Link className="dashboard-guide-card" href={publishedContentHref(guide)}>
        <span className="dashboard-guide-card-icon" aria-hidden="true"><BookOpen size={23} /></span>
        <span className="dashboard-guide-card-copy">
          <small>{guide.topic || "Guía de estudio"}</small>
          <strong>{guide.title}</strong>
        </span>
        <span className="dashboard-guide-card-action" aria-hidden="true">Guía de estudio <ArrowRight size={16} /></span>
      </Link>
    </li>
  );
}

export function DashboardScreen({
  available,
  recentItems = [],
  lastReadGuide = null,
  isAdministrator = false,
  guidedLearningEnabled = false,
  learningHome = null,
  learningHomeAvailable = false,
  viewer,
}: {
  available: boolean;
  recentItems?: ContentItem[];
  lastReadGuide?: ContentItem | null;
  lastReadAvailable?: boolean;
  isAdministrator?: boolean;
  guidedLearningEnabled?: boolean;
  learningHome?: LearningHome | null;
  learningHomeAvailable?: boolean;
  viewer?: { email: string };
}) {
  const recentGuides = recentItems
    .filter((item): item is Guide => item.kind === "guide")
    .sort(newestContentFirst)
    .slice(0, 5);
  const resumeGuide = lastReadGuide?.kind === "guide" ? lastReadGuide : null;

  return (
    <AppShell
      activeKey="dashboard"
      isAdministrator={isAdministrator}
      viewer={viewer}
      headerTitle=""
      guidedLearningEnabled={guidedLearningEnabled}
      mainClassName="dashboard-main dashboard-study-home"
    >
      <h1 className="sr-only">Inicio</h1>
      <div className={"dashboard-reference-grid" + (guidedLearningEnabled ? " has-routes" : "")}>
        <section className="dashboard-resume-section" aria-labelledby="dashboard-resume-title">
          <div className="section-heading-row"><h2 id="dashboard-resume-title">Seguir leyendo</h2></div>
          {resumeGuide ? (
            <Link className="dashboard-resume-card" href={publishedContentHref(resumeGuide)}>
              <span className="dashboard-resume-art" aria-hidden="true"><BookOpen size={31} /></span>
              <span className="dashboard-resume-copy">
                <span className="dashboard-resume-kicker">{resumeGuide.topic || "Guía de estudio"}</span>
                <strong>{resumeGuide.title}</strong>
                <span className="dashboard-resume-action">Continuar lectura <ArrowRight size={18} /></span>
              </span>
            </Link>
          ) : (
            <Link className="dashboard-resume-empty" href="/guias">
              <span className="dashboard-resume-empty-icon"><BookOpen aria-hidden="true" size={35} /></span>
              <span className="dashboard-resume-empty-copy">Descubre una guía para empezar a leer</span>
              <span className="dashboard-resume-empty-action">Explorar guías <ArrowRight aria-hidden="true" size={20} /></span>
            </Link>
          )}
        </section>
        <LearningDashboardSummary available={learningHomeAvailable} enabled={guidedLearningEnabled} home={learningHome} />
        <LearningDashboardReview available={learningHomeAvailable} enabled={guidedLearningEnabled} home={learningHome} />
        <section className="dashboard-section dashboard-recent" aria-labelledby="recent-title">
        <div className="section-heading-row">
          <h2 id="recent-title">Agregadas recientemente</h2>
          <Link href="/guias">Ver todas <ArrowRight aria-hidden="true" size={17} /></Link>
        </div>
        {recentGuides.length > 0 ? (
          <ol className="dashboard-guide-grid">
            {recentGuides.map((guide) => <GuideCard key={guide.id} guide={guide} />)}
          </ol>
        ) : (
          <div className="dynamic-empty-state" role="status">
            <BookOpen size={30} aria-hidden="true" />
            <div>
              <strong>{available ? "Aún no hay guías publicadas." : "No pudimos cargar las guías."}</strong>
              <span>{available ? "Las nuevas guías aparecerán aquí." : "Intenta actualizar en unos minutos."}</span>
            </div>
          </div>
        )}
        </section>
      </div>

    </AppShell>
  );
}
