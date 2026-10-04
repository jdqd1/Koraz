import { z } from "zod";
import { EditorV2DraftSchema, type EditorV2State } from "./editor-model";

const RecoverySchema = z.strictObject({
  engineVersion: z.literal("guided-v2"), actorUserId: z.uuid(), pathId: z.uuid().nullable(),
  pathVersionId: z.uuid().nullable(), baseEditVersion: z.number().int().positive().nullable(),
  localRevision: z.number().int().nonnegative(), savedAt: z.number().int().nonnegative(),
  draft: EditorV2DraftSchema,
  pending: z.strictObject({ key: z.uuid(), fingerprint: z.string().max(15 * 1024 * 1024), createdPathId: z.uuid().nullable() }).nullable(),
});
export type EditorV2Recovery = z.infer<typeof RecoverySchema>;
export function editorV2RecoveryKey(actorUserId: string, pathId?: string | null) {
  return `cediah:route-editor:v2:${actorUserId}:${pathId ?? "new"}`;
}
export function createEditorV2Recovery(state: EditorV2State, actorUserId: string, pending: EditorV2Recovery["pending"] = null, now = Date.now()): EditorV2Recovery {
  return { engineVersion: "guided-v2", actorUserId, pathId: state.confirmed?.pathId ?? null,
    pathVersionId: state.confirmed?.pathVersionId ?? null, baseEditVersion: state.confirmed?.editVersion ?? null,
    localRevision: state.localRevision, draft: structuredClone(state.draft), savedAt: now, pending };
}
export function parseEditorV2Recovery(raw: string | null, actorUserId: string, pathId: string | null, now = Date.now()) {
  try {
    if (!raw || raw.length > 25 * 1024 * 1024) return null;
    const result = RecoverySchema.safeParse(JSON.parse(raw));
    if (!result.success || result.data.actorUserId !== actorUserId || result.data.pathId !== pathId || now - result.data.savedAt >= 86_400_000 || result.data.savedAt > now + 60_000) return null;
    return result.data;
  } catch { return null; }
}
export function recoveryMatchesV2(recovery: EditorV2Recovery, state: EditorV2State) {
  return recovery.pathId === (state.confirmed?.pathId ?? null) && recovery.pathVersionId === (state.confirmed?.pathVersionId ?? null)
    && recovery.baseEditVersion === (state.confirmed?.editVersion ?? null);
}
