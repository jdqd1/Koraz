import { z } from "zod";
import { LearningPathStatusSchema } from "./guided-learning.js";

/** Private editorial summaries, including unpublished and archived v2 versions. */
export const V2EditorPathSummarySchema = z.strictObject({
  pathId: z.uuid(),
  title: z.string(),
  topicTitle: z.string(),
  unitCount: z.number().int().nonnegative(),
  status: LearningPathStatusSchema,
  versionNumber: z.number().int().positive(),
  archivedAt: z.iso.datetime().nullable(),
});
export const V2EditorWorkspaceResponseSchema = z.strictObject({ items: z.array(V2EditorPathSummarySchema) });
export type V2EditorPathSummary = z.infer<typeof V2EditorPathSummarySchema>;

/** Content from one pinned guide revision, available only to authorized editors. */
export const V2EditorSourceSectionsSchema = z.strictObject({
  sourceContentId: z.uuid(), resourceRevisionId: z.uuid(),
  documentSha256: z.string().regex(/^[a-fA-F0-9]{64}$/),
  title: z.string().min(1).max(500),
  sections: z.array(z.strictObject({ heading: z.string().max(500), body: z.string().max(30_000) })).max(100),
});
