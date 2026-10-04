import { V2HttpContracts } from "@cediah/contracts";
import type { EditorV2State } from "./editor-model";

export function serializeEditorV2(state: EditorV2State) {
  // Explicit allowlist: server identity, status, approval, hashes and policy snapshot stay out.
  const body = { package: structuredClone(state.draft.package), bindings: structuredClone(state.draft.bindings) };
  const parsed = state.confirmed
    ? V2HttpContracts.editorPatch.body.safeParse({ ...body, expectedVersion: state.confirmed.editVersion })
    : V2HttpContracts.editorCreate.body.safeParse(body);
  if (!parsed.success) return { ok: false as const, issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) };
  return { ok: true as const, body: parsed.data };
}
