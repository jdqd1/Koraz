"use client";
import { useSearchParams } from "next/navigation";
import type { z } from "zod";
import type { LearningResourceReaderSchema } from "@cediah/contracts";
import { StructuredGuideContent } from "./structured-guide-content";
import { richTextDocumentToSections } from "@/lib/guide-document";

export function LearningResourceReader({ resource }: { resource: z.infer<typeof LearningResourceReaderSchema> }) {
  const params = useSearchParams();
  const sections = resource.document?.content.length ? richTextDocumentToSections(resource.document) : resource.sections;
  const heading = resource.locator.sectionPath.at(-1) ?? resource.locator.heading.split("/").at(-1)?.trim();
  const located = Math.max(0, sections.findIndex(section => section.heading === heading));
  const requested = Number(params.get("seccion") ?? located);
  const index = Number.isInteger(requested) && requested >= 0 && requested < sections.length ? requested : located;
  function go(next: number) {
    const query = new URLSearchParams(params);
    query.set("seccion", String(next));
    window.history.pushState(null, "", `?${query}`);
  }
  return <section className="learning-guide-activity" aria-label="Lectura de consulta">
    <p>Consulta · Esta lectura no cambia tu progreso ni concede puntos.</p>
    {resource.locator.page ? <p>Referencia: página {resource.locator.page}.</p> : null}
    <article><StructuredGuideContent document={resource.document} sections={sections} sectionIndex={index} /></article>
    {sections.length > 1 ? <nav aria-label="Secciones de consulta"><button type="button" disabled={index === 0} onClick={() => go(index - 1)}>Anterior</button><span>{index + 1} de {sections.length}</span><button type="button" disabled={index === sections.length - 1} onClick={() => go(index + 1)}>Siguiente</button></nav> : null}
  </section>;
}
