import type { V2BoundRouteDefinition } from "@cediah/contracts";
import { draftFromRouteV2, editableV2, type EditorV2Draft, type EditorV2Section, type EditorV2State } from "./editor-model";

export type EditorV2Action =
  | { type: "edit"; draft: EditorV2Draft }
  | { type: "section"; section: EditorV2Section }
  | { type: "operation"; operation: EditorV2State["operation"] }
  | { type: "confirmed"; route: V2BoundRouteDefinition; at: number }
  | { type: "failure"; conflict: boolean; notice: string }
  | { type: "recover"; draft: EditorV2Draft; localRevision: number };

export function editorV2Reducer(state: EditorV2State, action: EditorV2Action): EditorV2State {
  if (action.type === "section") return { ...state, section: action.section };
  if (action.type === "operation") return { ...state, operation: action.operation };
  if (action.type === "failure") return { ...state, operation: "idle", conflict: action.conflict, notice: action.notice };
  if (action.type === "confirmed") return {
    ...state, confirmed: action.route, confirmedAt: action.at, draft: draftFromRouteV2(action.route),
    dirty: false, operation: "idle", conflict: false, notice: "Borrador confirmado por el servidor.",
  };
  if (state.operation !== "idle" || !editableV2(state)) return state;
  if (action.type === "edit" && JSON.stringify(action.draft) === JSON.stringify(state.draft)) return state;
  return {
    ...state, draft: structuredClone(action.draft), dirty: true,
    localRevision: action.type === "recover" ? Math.max(state.localRevision + 1, action.localRevision) : state.localRevision + 1,
    notice: "Cambios sin guardar. La revisión anterior ya no acredita esta copia.",
  };
}
