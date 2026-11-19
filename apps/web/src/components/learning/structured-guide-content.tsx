import type { RichTextDocument } from "@cediah/contracts";
import { RichTextRenderer } from "@/components/rich-text-renderer";
import { guideDocumentPages } from "@/lib/guide-document";

export function StructuredGuideContent({ document, sections, sectionIndex, selectedIndexes = [] }: {
  document: RichTextDocument | null; sections: { heading: string; body: string }[]; sectionIndex: number; selectedIndexes?: number[];
}) {
  const richDocument = document?.content.length ? document : null;
  const pages = richDocument ? guideDocumentPages(richDocument) : [];
  const selected = selectedIndexes.length ? pages.filter((_, index) => selectedIndexes.includes(index)) : pages;
  const page = selected.length === sections.length ? selected[sectionIndex] : richDocument;
  if (page) return <RichTextRenderer document={page} />;
  const section = sections[sectionIndex];
  return section ? <><h2>{section.heading}</h2><p style={{ whiteSpace: "pre-wrap" }}>{section.body}</p></> : <p role="alert">Esta revisión no contiene una lectura disponible.</p>;
}
