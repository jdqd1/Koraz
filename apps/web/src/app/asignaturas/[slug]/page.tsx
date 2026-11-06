import { notFound } from "next/navigation";
import { PracticeLibraryScreen } from "@/components/practice-library-screen";
import { AppShell } from "@/components/app-shell";
import { SubjectDetailScreen } from "@/components/subject-detail-screen";
import { getContentTopicOrder, getSubjectStudyCatalog } from "@/lib/server/content-api";
import { currentUserIsAdministrator } from "@/lib/server/current-user";

export const dynamic = "force-dynamic";

type SubjectPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SubjectPage({ params, searchParams }: SubjectPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const kind = Array.isArray(query.tipo) ? query.tipo[0] : query.tipo;
  if (kind === "quiz" || kind === "flashcards") return <PracticeLibraryScreen kind={kind} subjectSlug={slug} params={query} isAdministrator={await currentUserIsAdministrator()} />;
  const [result, isAdministrator] = await Promise.all([
    getSubjectStudyCatalog(slug),
    currentUserIsAdministrator(),
  ]);

  if (result.status === "ready") {
    const contentOrder = await getContentTopicOrder(result.detail.subject.id);
    return (
      <SubjectDetailScreen
        initialContentOrder={contentOrder.status === "ready" ? contentOrder.order : undefined}
        isAdministrator={isAdministrator}
        items={result.detail.items}
        practiceCounts={result.detail.practiceCounts}
        subject={result.detail.subject}
      />
    );
  }
  if (result.status === "not_found") notFound();

  return (
    <AppShell
      activeKey="subjects"
      headerTitle="Materias"
      isAdministrator={isAdministrator}
      mainClassName="content-unavailable-page"
    >
      <h1>No pudimos cargar esta materia.</h1>
      <p>Intenta actualizar la página en unos minutos.</p>
    </AppShell>
  );
}
