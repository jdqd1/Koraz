import { notFound } from "next/navigation";
import type { ContentItem, RichTextDocument, Subject } from "@cediah/contracts";
import { AppShell } from "@/components/app-shell";
import { DashboardScreen } from "@/components/dashboard-screen";
import { ContentDetailScreen } from "@/components/content-detail-screen";
import { LearningCompletionPanel } from "@/components/learning/activities/learning-completion-panel";
import { LearningHomeScreen } from "@/components/learning/learning-home-screen";
import { LearningPathScreen } from "@/components/learning/learning-path-screen";
import {
  learningVisualAttempt,
  learningVisualAwards,
  learningVisualBlockedUpgrade,
  learningVisualCompleteHome,
  learningVisualHome,
  learningVisualLongTitleHome,
  learningVisualNewHome,
  learningVisualPathDetail,
  learningVisualPaths,
  learningVisualProgress,
  learningVisualUpgrade,
} from "@/components/learning/learning-visual-fixtures";

export const dynamic = "force-dynamic";

const visualSubjects: Subject[] = ["Fisiología", "Anatomía", "Histología", "Cardiología"].map((name, index) => ({
  contentCount: 0,
  id: `a1000000-0000-4000-8000-${String(201 + index).padStart(12, "0")}`,
  name,
  slug: name.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
}));

const dashboardGuides: ContentItem[] = [
  ["Ventilación alveolar", "Fisiología", "Comprende el intercambio de gases y los factores que modifican la ventilación."],
  ["Músculos del compartimento anterior", "Anatomía", "Origen, inserción y relaciones anatómicas para un repaso claro."],
  ["Potenciales de acción", "Fisiología", "Repasa las fases y los canales que sostienen la excitabilidad celular."],
  ["Tejido epitelial", "Histología", "Reconoce sus tipos, funciones y características microscópicas."],
  ["Ciclo cardíaco", "Cardiología", "Relaciona presiones, válvulas y eventos eléctricos durante cada fase."],
].map(([title, topic, summary], index) => ({
  asset: null,
  authorUserId: "a1000000-0000-4000-8000-000000000001",
  content: { document: null, keyPoints: [], linkedVideoId: null, quiz: { questions: [] }, regions: [], sections: [] },
  createdAt: `2026-09-${String(20 + index).padStart(2, "0")}T12:00:00.000Z`,
  estimatedMinutes: 8 + index * 2,
  featured: false,
  id: `a1000000-0000-4000-8000-${String(100 + index).padStart(12, "0")}`,
  kind: "guide" as const,
  publishedAt: `2026-09-${String(20 + index).padStart(2, "0")}T12:00:00.000Z`,
  slug: `guia-visual-${index + 1}`,
  status: "published" as const,
  subjectIds: visualSubjects.filter((subject) => subject.name === topic).map((subject) => subject.id),
  summary: summary!,
  title: title!,
  topic: topic!,
  updatedAt: `2026-09-${String(20 + index).padStart(2, "0")}T12:00:00.000Z`,
}));

function readerParagraph(text: string) {
  return {
    type: "paragraph",
    content: text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part) => part.startsWith("**")
      ? { type: "text", text: part.slice(2, -2), marks: [{ type: "bold" }] }
      : { type: "text", text: part }),
  };
}

const readerDocument = {
  type: "doc",
  content: [
    readerParagraph("La **columna vertebral o raquis** constituye el eje óseo del cuello y del tronco. Está formada por una sucesión de vértebras que combina dos propiedades aparentemente opuestas: **resistencia**, necesaria para sostener y transmitir cargas, y **movilidad**, indispensable para orientar la cabeza y el tronco. Además, la superposición de los forámenes vertebrales forma el **conducto vertebral**, que protege las estructuras nerviosas contenidas en su interior. En la disposición más frecuente se reconocen **7 vértebras cervicales, 12 torácicas, 5 lumbares y una porción pélvica formada por el sacro y el cóccix**; las piezas sacras y coccígeas se fusionan en grado variable con la edad."),
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Organización general y vértebra tipo" }] },
    readerParagraph("Las vértebras libres presentan caracteres regionales muy marcados, pero conservan un plan estructural común. Cada vértebra posee un **cuerpo vertebral**, situado anteriormente, y un **arco vertebral**, situado posteriormente. Ambos delimitan el **foramen vertebral**. El cuerpo es el principal elemento de sustentación y aumenta progresivamente de volumen hacia las regiones inferiores de la columna, donde debe soportar cargas mayores. El arco vertebral se une al cuerpo mediante los **pedículos** y se completa posteriormente por las **láminas**."),
    { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Partes de la vértebra" }] },
    readerParagraph("La relación entre el cuerpo y el arco vertebral permite reconocer las estructuras de una vértebra típica. [1]"),
    { type: "blockquote", content: [readerParagraph("Punto clave: el foramen vertebral está delimitado por el cuerpo y el arco vertebral.")] },
    { type: "table", content: [
      { type: "tableRow", content: [
        { type: "tableHeader", content: [readerParagraph("Elemento")] },
        { type: "tableHeader", content: [readerParagraph("Características generales")] },
        { type: "tableHeader", content: [readerParagraph("Papel principal")] },
      ] },
      { type: "tableRow", content: [
        { type: "tableCell", content: [readerParagraph("Cuerpo vertebral")] },
        { type: "tableCell", content: [readerParagraph("Masa ósea anterior con caras superior e inferior para los discos")] },
        { type: "tableCell", content: [readerParagraph("Sustentación y transmisión de cargas")] },
      ] },
      { type: "tableRow", content: [
        { type: "tableCell", content: [readerParagraph("Pedículos")] },
        { type: "tableCell", content: [readerParagraph("Unen el cuerpo y el arco vertebral")] },
        { type: "tableCell", content: [readerParagraph("Forman las paredes del conducto vertebral")] },
      ] },
    ] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Referencias" }] },
    { type: "orderedList", content: [{ type: "listItem", content: [readerParagraph("[1] Atlas de anatomía de la columna vertebral.")] }] },
  ],
} as RichTextDocument;

const supportedModes = new Set([
  "complete",
  "completion",
  "dashboard",
  "dashboard-empty",
  "dashboard-error",
  "dashboard-no-guide",
  "error",
  "long",
  "new",
  "path",
  "path-upgrade",
  "path-upgrade-blocked",
  "progress",
  "reader",
  "routes",
  "today",
]);

function LearningFixtureShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      activeKey="learning"
      guidedLearningEnabled
      headerTitle="Aprendizaje guiado"
      viewer={{ email: "estudiante.visual@example.test" }}
    >
      {children}
    </AppShell>
  );
}

export default async function LearningVisualFixturePage({ searchParams }: {
  searchParams: Promise<{ estado?: string }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();

  const requested = (await searchParams).estado ?? "today";
  const mode = supportedModes.has(requested) ? requested : "today";
  if (mode.startsWith("dashboard")) {
    return (
      <DashboardScreen
        available
        guidedLearningEnabled
        lastReadGuide={mode === "dashboard-no-guide" ? null : dashboardGuides[1]}
        recentItems={dashboardGuides}
        subjects={visualSubjects}
        learningHome={mode === "dashboard-empty" ? learningVisualNewHome : mode === "dashboard-error" ? null : learningVisualHome}
        learningHomeAvailable={mode !== "dashboard-error"}
        viewer={{ email: "estudiante.visual@example.test" }}
      />
    );
  }

  if (mode === "reader") {
    const guide = dashboardGuides[1] as Extract<ContentItem, { kind: "guide" }>;
    return <ContentDetailScreen trackView={false} item={{
      ...guide,
      title: "Columna vertebral",
      content: {
        ...guide.content,
        document: readerDocument,
        keyPoints: [
          "Las vértebras libres presentan caracteres regionales muy marcados",
          "El foramen vertebral está delimitado por el cuerpo y el arco vertebral",
          "El arco vertebral se une al cuerpo mediante los pedículos",
        ],
        sections: [],
      },
    }} />;
  }

  if (mode === "path" || mode === "path-upgrade" || mode === "path-upgrade-blocked") {
    const upgrade = mode === "path-upgrade"
      ? learningVisualUpgrade
      : mode === "path-upgrade-blocked"
        ? learningVisualBlockedUpgrade
        : null;
    return <LearningFixtureShell><LearningPathScreen path={learningVisualPathDetail} progress={learningVisualProgress} upgrade={upgrade} /></LearningFixtureShell>;
  }

  if (mode === "completion") {
    const completionProgress = {
      ...learningVisualProgress,
      completedEssentialSteps: 5,
      percentage: 71,
      units: learningVisualProgress.units.map((unit, index) => index === 1
        ? { ...unit, completedEssentialSteps: unit.totalEssentialSteps }
        : unit),
    };
    return (
      <LearningFixtureShell>
        <main className="learning-activity-main">
          <LearningCompletionPanel attempt={learningVisualAttempt} awards={learningVisualAwards} progress={completionProgress} />
        </main>
      </LearningFixtureShell>
    );
  }

  const error = mode === "error";
  const home = mode === "new"
    ? learningVisualNewHome
    : mode === "complete"
      ? learningVisualCompleteHome
      : mode === "long"
        ? learningVisualLongTitleHome
        : learningVisualHome;
  const tab = mode === "routes" ? "rutas" : mode === "progress" ? "progreso" : "hoy";
  const paths = mode === "new"
    ? learningVisualPaths.map((path) => ({ ...path, enrollment: null }))
    : mode === "long"
      ? learningVisualPaths.map((path, index) => index === 0 ? { ...path, title: home.activePath?.title ?? path.title } : path)
      : learningVisualPaths;

  return (
    <LearningFixtureShell>
      <LearningHomeScreen
        available={!error}
        home={error ? null : home}
        homeAvailable={!error}
        paths={error ? [] : paths}
        progress={error ? [] : [learningVisualProgress]}
        tab={tab}
      />
    </LearningFixtureShell>
  );
}
