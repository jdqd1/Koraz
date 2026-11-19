import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RichTextDocumentSchema } from "@cediah/contracts";
import { StructuredGuideContent } from "./structured-guide-content";
import { guideDocumentPages, richTextDocumentToSections } from "@/lib/guide-document";
import { StudyRenderer } from "./v2/renderers/study";
import { VideoActivity } from "./activities/video-activity";
import { legacyActivityFixture } from "./activities/activity-player-fixtures";
import type { LearningAttempt } from "@cediah/contracts";

const text = (value: string) => [{ type: "text", text: value }];
const document = RichTextDocumentSchema.parse({ type: "doc", content: [
  { type: "heading", attrs: { level: 1 }, content: text("Tabla") },
  { type: "table", content: [{ type: "tableRow", content: [{ type: "tableHeader", content: [{ type: "paragraph", content: text("Cabecera") }] }, { type: "tableCell", content: [{ type: "paragraph", content: text("Valor") }] }] }] },
  { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: text("Elemento") }] }] },
  { type: "heading", attrs: { level: 1 }, content: text("Segunda sección") }, { type: "paragraph", content: text("Otra lectura") },
] });
describe("structured learning guides", () => {
  it("retains table cells and lists instead of replacing a rich document with its text projection", () => {
    const sections = richTextDocumentToSections(document);
    expect(guideDocumentPages(document)).toHaveLength(2);
    const html = renderToStaticMarkup(<StructuredGuideContent document={document} sections={sections} sectionIndex={0} />);
    for (const element of ["<table", "<th", "<td", "<ul", "<li"]) expect(html).toContain(element);
    expect(html).not.toContain("Otra lectura");
    const second = renderToStaticMarkup(<StructuredGuideContent document={document} sections={sections} sectionIndex={1} />);
    expect(second).toContain("Otra lectura"); expect(second).not.toContain("Cabecera");
  });
  it("keeps a pinned selection and legacy plain sections readable", () => {
    const html = renderToStaticMarkup(<StructuredGuideContent document={document} sections={[{ heading: "Segunda sección", body: "Otra lectura" }]} sectionIndex={0} selectedIndexes={[1]} />);
    expect(html).toContain("Otra lectura"); expect(html).not.toContain("Cabecera");
    expect(renderToStaticMarkup(<StructuredGuideContent document={null} sections={[{ heading: "Antigua", body: "Texto" }]} sectionIndex={0} />)).toContain("Texto");
    expect(renderToStaticMarkup(<StructuredGuideContent document={{ type: "doc", content: [] }} sections={[{ heading: "Antigua", body: "Texto" }]} sectionIndex={0} />)).toContain("Texto");
  });
  it("cannot acknowledge a study image before authorized media has loaded", () => {
    const activity = { key: "study", objectiveKey: "objective", phase: "learn" as const, representation: "text" as const, prompt: "Lectura", kind: "study" as const,
      payload: { body: "Texto", focusSpans: [], assetKey: "image", scaffold: "explanation" as const, videoRange: null } };
    const html = renderToStaticMarkup(<StudyRenderer activity={activity} disabled={false} onSubmit={() => {}} />);
    expect(html).toContain("Imagen no disponible"); expect(html).toMatch(/disabled=""[^>]*>Guardar lectura/);
  });
  it("does not offer completion for a native video before its media is available", () => {
    const attempt = legacyActivityFixture("video") as LearningAttempt & { manifest: Extract<LearningAttempt["manifest"], { projection: "video" }> };
    const html = renderToStaticMarkup(<VideoActivity attempt={attempt} mutate={async () => null} />);
    expect(html).toContain("Preparando el video");
    expect(html).toMatch(/disabled=""[^>]*>[\s\S]*?Omitir video y completar/);
  });
});
