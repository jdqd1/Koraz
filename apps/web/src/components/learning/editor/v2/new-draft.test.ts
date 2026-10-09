import { describe, expect, it } from "vitest";
import { EditorV2DraftSchema } from "./editor-model";
import { editorV2CatalogAvailable, newEditorV2Draft } from "./new-draft";
describe("new v2 draft", () => {
  it("opens an incomplete blank draft without invented resources, activities or evidence", () => {
    const draft = newEditorV2Draft("first");
    expect(EditorV2DraftSchema.safeParse(draft).success).toBe(true);
    expect(draft.bindings).toEqual({topicContentId:"",sources:[],assets:[]});
    expect(draft.package.objectives).toEqual([]); expect(draft.package.activities).toEqual([]);
    expect(JSON.stringify(draft)).not.toMatch(/masteredAt|consolidatedAt|approvedBy|publishedAt/);
    expect(newEditorV2Draft("second").package.packageKey).not.toBe(draft.package.packageKey);
  });
  it("requires a server-authorized strict catalog before offering creation", () => {
    const body = {items:[],nextCursor:null,topics:[]};
    expect(editorV2CatalogAvailable({status:200,body})).toBe(true);
    for (const status of [401,403,404,503]) expect(editorV2CatalogAvailable({status,body})).toBe(false);
    expect(editorV2CatalogAvailable({status:200,body:{}})).toBe(false);
  });
});
