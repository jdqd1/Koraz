import { type V2BoundRouteDefinition } from "@cediah/contracts";
import { createEditorV2Api, v2FailureNotice, type EditorV2Api, type V2EditorFailure, type V2PatchBody } from "./editor-api";
import { editableV2, type EditorV2Draft, type EditorV2State } from "./editor-model";
import { editorV2Reducer, type EditorV2Action } from "./editor-reducer";
import { createEditorV2Recovery, editorV2RecoveryKey, recoveryMatchesV2, type EditorV2Recovery } from "./editor-recovery";
import { serializeEditorV2 } from "./editor-serialization";

type RecoveryStore = Pick<Storage, "setItem" | "removeItem">;
export function createEditorV2Controller(input: {
  state: EditorV2State; actorUserId: string; api?: EditorV2Api;
  storage?: RecoveryStore; createKey?: () => string; now?: () => number;
  onCreated?: (pathId: string) => void;
}) {
  let state = input.state;
  let pending: EditorV2Recovery["pending"] = null;
  let storageAvailable = true;
  const api = input.api ?? createEditorV2Api();
  const now = input.now ?? Date.now;
  const createKey = input.createKey ?? (() => crypto.randomUUID());
  const listeners = new Set<() => void>();
  const recoveryKey = () => editorV2RecoveryKey(input.actorUserId, state.confirmed?.pathId);
  function writeRecovery() {
    if (!input.storage || !state.dirty) return;
    try { input.storage.setItem(recoveryKey(), JSON.stringify(createEditorV2Recovery(state, input.actorUserId, pending, now()))); }
    catch { storageAvailable = false; }
  }
  function dispatch(action: EditorV2Action) {
    state = editorV2Reducer(state, action);
    writeRecovery();
    listeners.forEach((listener) => listener());
  }
  function failure(result: V2EditorFailure) {
    dispatch({ type: "failure", conflict: state.conflict || result.status === 409, notice: v2FailureNotice(result) });
    return false;
  }
  function confirm(route: V2BoundRouteDefinition) {
    const oldKey = recoveryKey();
    pending = null;
    dispatch({ type: "confirmed", route, at: now() });
    try { input.storage?.removeItem(oldKey); } catch { storageAvailable = false; }
    listeners.forEach((listener) => listener());
  }
  async function save() {
    if (state.operation !== "idle" || state.conflict || !editableV2(state)) return false;
    if (state.confirmed && !state.dirty) return true;
    const serialized = serializeEditorV2(state);
    if (!serialized.ok) {
      dispatch({ type: "failure", conflict: false, notice: "Revisa los campos marcados antes de guardar." });
      return false;
    }
    const fingerprint = JSON.stringify(serialized.body);
    if (!pending || pending.fingerprint !== fingerprint) pending = { key: createKey(), fingerprint, createdPathId: null };
    const request = pending;
    const base = state.confirmed;
    dispatch({ type: "operation", operation: "saving" });
    try {
      if (base) {
        const result = await api.save(base.pathId, serialized.body as V2PatchBody, request.key);
        if (!result.ok) return failure(result);
        if (result.value.route.pathId !== base.pathId || result.value.route.pathVersionId !== base.pathVersionId || result.value.route.editVersion !== base.editVersion + 1) {
          return failure({ ok: false, status: 503, code: "invalid_confirmation" });
        }
        confirm(result.value.route);
        return true;
      }
      if (!request.createdPathId) {
        const created = await api.create({ package: serialized.body.package, bindings: serialized.body.bindings }, request.key);
        if (!created.ok) return failure(created);
        request.createdPathId = created.value.pathId;
        writeRecovery();
      }
      // POST returns identifiers only. Read the confirmed definition before clearing recovery.
      const loaded = await api.get(request.createdPathId);
      if (!loaded.ok) return failure(loaded);
      if (loaded.value.route.pathId !== request.createdPathId) return failure({ ok: false, status: 503, code: "invalid_confirmation" });
      confirm(loaded.value.route);
      input.onCreated?.(loaded.value.route.pathId);
      return true;
    } catch { return failure({ ok: false, status: 503, code: "network_error" }); }
    finally { if (state.operation !== "idle") dispatch({ type: "operation", operation: "idle" }); }
  }
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    dispatch,
    api,
    confirmWorkflow(route: V2BoundRouteDefinition) {
      if (state.dirty || !state.confirmed || route.pathId !== state.confirmed.pathId || (route.pathVersionId === state.confirmed.pathVersionId && route.editVersion < state.confirmed.editVersion)) return false;
      confirm(route);
      return true;
    },
    edit(draft: EditorV2Draft) {
      if (pending?.createdPathId) return; // Finish confirmation of an accepted creation first.
      dispatch({ type: "edit", draft });
    },
    save,
    canEdit: () => editableV2(state) && !pending?.createdPathId,
    canSave: () => editableV2(state) && !state.conflict,
    storageAvailable: () => storageAvailable,
    recovery: () => createEditorV2Recovery(state, input.actorUserId, pending, now()),
    recover(recovery: EditorV2Recovery) {
      if (!recoveryMatchesV2(recovery, state) || state.operation !== "idle" || !editableV2(state)) return false;
      pending = recovery.pending;
      dispatch({ type: "recover", draft: recovery.draft, localRevision: recovery.localRevision });
      return true;
    },
    discardRecovery() { try { input.storage?.removeItem(recoveryKey()); } catch { storageAvailable = false; } },
    async openSavedVersion() {
      if (state.operation !== "idle" || !state.confirmed) return false;
      const base = state.confirmed;
      dispatch({ type: "operation", operation: "loading" });
      try {
        const result = await api.get(base.pathId);
        if (!result.ok) return failure(result);
        if (result.value.route.pathId !== base.pathId) return failure({ ok: false, status: 503, code: "invalid_confirmation" });
        confirm(result.value.route);
        return true;
      } catch { return failure({ ok: false, status: 503, code: "network_error" }); }
    },
  };
}
export type EditorV2Controller = ReturnType<typeof createEditorV2Controller>;
