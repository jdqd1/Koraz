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
