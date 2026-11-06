import Link from "next/link";
import { ArrowRight, Books, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";
import { publishedContentHref, studyContentKindLabels, subjectContentHref } from "@/lib/content-navigation";
import { getContentTopicOrder, getPracticeLibrary } from "@/lib/server/content-api";
import { AppShell } from "./app-shell";
import { IconBackLink } from "./compact-navigation";
import { ContentResourceList } from "./content-resource-list";

type Props = { kind: "quiz" | "flashcards"; subjectSlug?: string; isAdministrator: boolean; params: Record<string, string | string[] | undefined> };
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim() ?? "";

export async function PracticeLibraryScreen({ kind, subjectSlug, isAdministrator, params }: Props) {
  const query = first(params.q).slice(0, 120), topic = subjectSlug ? first(params.tema).slice(0, 120) : "";
  const page = Math.max(1, Math.min(100_000, Number.parseInt(first(params.pagina), 10) || 1));
  const input = new URLSearchParams({ kind, q: query, topic, page: String(page) });
  if (subjectSlug) input.set("subject", subjectSlug);
  const result = await getPracticeLibrary(input);
  if (result.status === "not_found") notFound();
  const data = result.status === "ready" ? result.data : null;
  const label = studyContentKindLabels[kind];
  const root = subjectSlug ? `/asignaturas/${encodeURIComponent(subjectSlug)}` : "/asignaturas";
  function href(nextPage: number) {
    const nav = new URLSearchParams({ tipo: kind });
    if (query) nav.set("q", query);
    if (topic) nav.set("tema", topic);
    if (nextPage > 1) nav.set("pagina", String(nextPage));
    return `${root}?${nav}`;
  }
  const browsingGroups = !query && !topic;
  const groups = data?.groups ?? [];
  if (browsingGroups && data?.subject && groups.length > 1) {
    const order = await getContentTopicOrder(data.subject.id);
    if (order.status === "ready") {
      const key = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
      const ranks = new Map(order.order.topicOrder.map((name, index) => [key(name), index]));
      groups.sort((a, b) => (ranks.get(key(a.name)) ?? Infinity) - (ranks.get(key(b.name)) ?? Infinity) || a.name.localeCompare(b.name, "es"));
    }
  }
  return <AppShell activeKey={kind} headerTitle={label} isAdministrator={isAdministrator} mainClassName="subject-directory-main">
    <section className="subject-directory-page" aria-label={label}>
      {subjectSlug && <nav aria-label="Navegación del material"><IconBackLink href={topic ? subjectContentHref(subjectSlug, kind) : root} label={topic ? "Volver al temario" : "Volver a la materia"} /></nav>}
      <h2 className="subject-directory-title">{topic || (data?.subject ? `${label} de ${data.subject.name}` : `${label} por materia`)}</h2>
      <form action={root} method="get" role="search" className="subject-directory-search">
        <input type="hidden" name="tipo" value={kind} />{topic && <input type="hidden" name="tema" value={topic} />}
        <input aria-label={`Buscar ${label.toLowerCase()}`} placeholder={`Buscar ${label.toLowerCase()}`} type="search" name="q" defaultValue={query} maxLength={120} />
        <button type="submit" aria-label="Buscar" title="Buscar"><MagnifyingGlass aria-hidden size={20} /></button>{query && <Link href={subjectSlug ? subjectContentHref(subjectSlug, kind, topic) : `/asignaturas?tipo=${kind}`}>Limpiar</Link>}
      </form>
      {!data ? <div role="alert"><p>No se pudo cargar la biblioteca.</p><Link href={href(page)}>Reintentar</Link></div> : <>
        {browsingGroups && groups.length > 0 && <nav aria-label={subjectSlug ? "Temario" : "Materias"}><ul className="subject-directory-grid">{groups.map(group => <li key={group.key}>
          <Link className="subject-directory-item" href={subjectSlug ? subjectContentHref(subjectSlug, kind, group.name) : subjectContentHref(group.key, kind)}>
            <span className="subject-directory-icon" aria-hidden="true"><Books size={22} /></span>
            <span className="subject-directory-copy"><strong>{group.name}</strong></span><span>{group.count} {group.count === 1 ? "recurso" : "recursos"}</span>
            <ArrowRight className="subject-directory-arrow" size={18} aria-hidden />
          </Link>
        </li>)}</ul></nav>}
        {data.items.length > 0 && <><p>{data.total} {data.total === 1 ? "recurso" : "recursos"}{data.total > data.limit ? ` · Página ${page} de ${Math.ceil(data.total / data.limit)}` : ""}</p>
          <ContentResourceList items={data.items} searchQuery={query} ariaLabel={label} hrefForItem={item => publishedContentHref(item, { origin: "asignatura", subjectSlug: subjectSlug ?? item.subjectSlug, topic: topic || item.topic })} /></>}
        {!data.items.length && (!browsingGroups || !groups.length) && <p role="status">{query ? "No encontramos recursos para esa búsqueda." : page > 1 ? "Esta página no tiene recursos." : "Todavía no hay materiales disponibles."}</p>}
        {(page > 1 || page * data.limit < data.total) && <nav className="compact-navigation-row" aria-label="Páginas de recursos">
          {page > 1 && <Link href={href(page-1)}>Anterior</Link>}{page * data.limit < data.total && <Link href={href(page+1)}>Siguiente</Link>}
        </nav>}
      </>}
    </section>
  </AppShell>;
}
