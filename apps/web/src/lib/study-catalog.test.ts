import { describe, expect, it } from "vitest";
import type { StudyCatalogItem } from "@cediah/contracts";
import { getStudySummaryCatalog, getSubjectStudySummaryCatalog } from "./study-catalog";
const item = (id: string, kind: StudyCatalogItem["kind"], extra: Partial<StudyCatalogItem> = {}): StudyCatalogItem => ({
  id, kind, title: id, slug: id, estimatedMinutes: null, featured: false, hasEmbeddedGuide: false,
  hasQuiz: false, hasFlashcards: false, linkedVideoId: null, publishedAt: null, regions: [], subjectIds: [],
  summary: "", topic: "", updatedAt: "2026-11-08T00:00:00Z", viewCount: 0, ...extra,
});
describe("F05 capability union", () => {
  const items = [item("video", "video", { hasEmbeddedGuide: true, subjectIds: ["anatomia"] }),
    item("guide-old", "guide", { linkedVideoId: "video", updatedAt: "2026-11-07T00:00:00Z" }),
    item("guide-new", "guide", { linkedVideoId: "video", hasQuiz: true, hasFlashcards: true, subjectIds: ["cirugia"] }),
    item("embedded", "video", { hasEmbeddedGuide: true, hasQuiz: true, hasFlashcards: true, subjectIds: ["anatomia"] })];
  it.each(["guide", "quiz", "flashcards"] as const)("reconciles global and subject %s capabilities and deduplicates linked guides", kind => {
    const global = getStudySummaryCatalog(items, kind);
    expect(global.map(item => item.id)).toEqual(["guide-new", "embedded"]);
    expect(global[0]?.subjectIds.sort()).toEqual(["anatomia", "cirugia"]);
    expect(getSubjectStudySummaryCatalog(items, kind, "anatomia").map(item => item.id)).toEqual(["guide-new", "embedded"]);
  });
  it("uses the same deterministic linked-guide winner when timestamps tie", () => {
    const a = item("a", "guide", { linkedVideoId: "video" });
    const b = item("b", "guide", { linkedVideoId: "video" });
    expect(getStudySummaryCatalog([b,a,items[0]!], "guide").map(item => item.id)).toEqual(["a"]);
  });
});
