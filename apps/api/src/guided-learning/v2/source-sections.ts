import { V2EditorSourceSectionsSchema } from "@cediah/contracts";
import type { DatabaseClient } from "../../db/database.js";
import { guideAdapter, type GuidePayload } from "../adapters/guide.js";
import { hashLearningSnapshot } from "../snapshot-hash.js";

export function guideSectionsV2(content: GuidePayload) {
  if (content.sections.length) return content.sections;
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
  const snapshot = row.payload_json as { content?: unknown; title?: string; projection?: string; sourceContentId?: string };
  if (snapshot.projection !== "guide" || snapshot.sourceContentId !== row.source_content_id) return { status: "resource_changed" as const };
  try {
    const content = guideAdapter.parse(snapshot.content);
    return { status: "success" as const, value: V2EditorSourceSectionsSchema.parse({ sourceContentId: row.source_content_id, resourceRevisionId: row.id, documentSha256: row.payload_hash, title: snapshot.title, sections: guideSectionsV2(content) }) };
  } catch { return { status: "resource_changed" as const }; }
}
