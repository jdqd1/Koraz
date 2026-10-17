import { V2EditorSourceSectionsSchema } from "@cediah/contracts";
import type { DatabaseClient } from "../../db/database.js";
import { guideAdapter, type GuidePayload } from "../adapters/guide.js";
import { hashLearningSnapshot } from "../snapshot-hash.js";
import { z } from "zod";

function markdownSections(text: string, initialHeading: string) {
  const sections: Array<{ heading: string; body: string }> = [];
  let heading = initialHeading, parts: string[] = [], fence = "";
  const flush = () => { const body = parts.join("").trim(); if (body) sections.push({ heading, body }); parts = []; };
  for (const raw of text.match(/[^\r\n]*(?:\r\n|\r|\n|$)/g) ?? []) {
    const line = raw.replace(/[\r\n]+$/, "");
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (marker) {
      if (!fence) fence = marker[1]!;
      else if (marker[1]![0] === fence[0] && marker[1]!.length >= fence.length && !marker[2]!.trim()) fence = "";
      parts.push(raw); continue;
    }
    // shortcut: only ATX headings are split; extend if a supported importer starts emitting setext headings.
    const match = !fence && /^ {0,3}#{1,6}[\t ]+(.+?)(?:[\t ]+#+[\t ]*)?$/.exec(line);
    if (match) { flush(); heading = match[1]!.trim(); }
    else parts.push(raw);
  }
  flush(); return sections;
}

export function guideSectionsV2(content: GuidePayload) {
  if (content.sections.length) return content.sections.flatMap(section => markdownSections(section.body, section.heading));
  const sections: Array<{ heading: string; body: string }> = [];
  let heading = "Contenido", parts: string[] = [];
  type Node = { type?: string; text?: string; content?: Node[] };
  const text = (node: Node): string => node.text ?? (node.content ?? []).map(text).join(node.type === "paragraph" ? "" : " ");
  const flush = () => { if (parts.length) sections.push({ heading, body: parts.join("\n\n") }); parts = []; };
  for (const node of content.document?.content ?? []) {
    if (node.type === "heading") { flush(); heading = text(node); }
    else { const body = text(node); if (body.trim()) parts.push(body); }
  }
  flush();
  return sections;
}

const legacySnapshot = z.strictObject({ title: z.string().min(1).max(500), text: z.string().max(3_000_000), originalDocumentSha256: z.string().regex(/^[a-fA-F0-9]{64}$/) });
const canonicalSnapshot = z.object({ title: z.string().min(1).max(500), projection: z.literal("guide"), sourceContentId: z.uuid(), content: z.unknown() });
export function guideSnapshotSectionsV2(payload: unknown, sourceContentId: string) {
  // Early v2 imports pinned a text snapshot. Its checksum and access are checked by the same reader.
  const legacy = legacySnapshot.safeParse(payload);
  if (legacy.success) return { title: legacy.data.title, sections: markdownSections(legacy.data.text, legacy.data.title) };
  const snapshot = canonicalSnapshot.safeParse(payload);
  if (!snapshot.success || snapshot.data.sourceContentId !== sourceContentId) return null;
  try { return { title: snapshot.data.title, sections: guideSectionsV2(guideAdapter.parse(snapshot.data.content)) }; }
  catch { return null; }
}

export async function readEditorSourceSectionsV2(database: DatabaseClient, input: { actorUserId: string; canEditAll: boolean; resourceRevisionId: string }) {
  const row = await database.selectFrom("learning_resource_revisions as revision")
    .innerJoin("learning_resources as resource", "resource.id", "revision.resource_id")
    .innerJoin("content_items as content", "content.id", "resource.source_content_id")
    .select(["revision.id", "revision.payload_json", "revision.payload_hash", "resource.source_content_id"])
    .where("revision.id", "=", input.resourceRevisionId).where("resource.projection", "=", "guide")
    .where("resource.retired_at", "is", null).where("content.kind", "=", "guide").where("content.status", "!=", "archived")
    .where(eb => eb.or([eb("content.status", "=", "published"), eb("content.author_user_id", "=", input.actorUserId), ...(input.canEditAll ? [eb.val(true)] : [])]))
    .where(eb => eb.or([eb("content.catalog_visibility", "=", "catalog"), eb("content.author_user_id", "=", input.actorUserId), ...(input.canEditAll ? [eb.val(true)] : [])]))
    .executeTakeFirst();
  if (!row) return { status: "not_found" as const };
  if (hashLearningSnapshot(row.payload_json) !== row.payload_hash) return { status: "resource_changed" as const };
  const snapshot = guideSnapshotSectionsV2(row.payload_json, row.source_content_id);
  if (!snapshot) return { status: "resource_changed" as const };
  try {
    return { status: "success" as const, value: V2EditorSourceSectionsSchema.parse({ sourceContentId: row.source_content_id, resourceRevisionId: row.id, documentSha256: row.payload_hash, ...snapshot }) };
  } catch { return { status: "resource_changed" as const }; }
}
