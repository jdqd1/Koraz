import { describe, expect, it } from "vitest";
import { selectSourceSectionV2 } from "./source-sections";
import { sourceLabelV2 } from "./source-labels";
import { editorV2FixturePackage, fixtureV2Id } from "./editor-fixtures";

describe("guide section selection", () => {
  const source = editorV2FixturePackage().sources[0]!;
  const guide = { title: "Guía", resourceRevisionId: fixtureV2Id(6), sourceContentId: fixtureV2Id(5), documentSha256: source.documentSha256, sections: [{ heading: "Relaciones", body: "Un fragmento literal que respalda la actividad." }] };
  it("sets a readable name and exact excerpt while preserving provenance", () => {
    const next = selectSourceSectionV2(source, guide, 0)!;
    expect(next).toMatchObject({ key: source.key, title: "Guía · Relaciones", citation: source.citation, excerpt: guide.sections[0]!.body, locator: { heading: "Relaciones", sectionPath: ["Relaciones"], page: null }, documentSha256: source.documentSha256, verification: source.verification });
    expect(source.title).toBe("Guía sintética");
  });
  it("requires the same document and a real bounded fragment, without silently truncating", () => {
    expect(selectSourceSectionV2(source, { ...guide, documentSha256: "b".repeat(64) }, 0)).toBeNull();
    expect(selectSourceSectionV2(source, guide, 100)).toBeNull();
    expect(selectSourceSectionV2(source, guide, 0, "texto inventado")).toBeNull();
    const long = { ...guide, sections: [{ heading: "Extensa", body: "X".repeat(10001) }] };
    expect(selectSourceSectionV2(source, long, 0)).toBeNull();
    expect(selectSourceSectionV2(source, long, 0, "XXX")!.excerpt).toBe("XXX");
  });
  it("distinguishes old duplicate source names in every selector", () => {
    const sources = [source, { ...source, key: "other", locator: { ...source.locator, heading: "Otra sección" } }];
    expect(sourceLabelV2(sources, sources[0]!)).toBe("Guía sintética · Sección");
    expect(sourceLabelV2(sources, sources[1]!)).toBe("Guía sintética · Otra sección");
    expect(sourceLabelV2([source], source)).toBe(source.title);
  });
});
