import { RoutePackageSchema, V2BindingsSchema, V2BoundRouteDefinitionSchema, type RoutePackage, type V2BoundRouteDefinition } from "@cediah/contracts";
import { z } from "zod";

export const editorV2Sections = [
  { key: "sources", label: "Datos y fuentes" },
  { key: "objectives", label: "Objetivos" },
  { key: "journey", label: "Recorrido" },
  { key: "assessment", label: "Evaluación y repaso" },
  { key: "review", label: "Revisión" },
] as const;
export type EditorV2Section = typeof editorV2Sections[number]["key"];
export type EditorV2Draft = { package: RoutePackage; bindings: z.infer<typeof V2BindingsSchema> };
// Recovery retains incomplete inputs throughout the package, while rejecting wrong
// shapes, unknown fields and unknown kinds. Only the serializer authorizes HTTP inputs.
const DraftShape = z.strictObject({ package: RoutePackageSchema, bindings: V2BindingsSchema });
export const EditorV2DraftSchema = z.custom<EditorV2Draft>((value) => {
  const result = DraftShape.safeParse(value);
  return result.success || result.error.issues.every((issue) => ["too_small", "too_big", "invalid_format", "custom"].includes(issue.code));
});
export type EditorV2State = {
  engineVersion: "guided-v2";
  draft: EditorV2Draft;
  confirmed: V2BoundRouteDefinition | null;
  confirmedAt: number | null;
  dirty: boolean;
  localRevision: number;
  section: EditorV2Section;
  operation: "idle" | "saving" | "loading";
  conflict: boolean;
  notice: string;
};
export function editableV2(state: EditorV2State) {
  return !state.confirmed || ["draft", "changes_requested"].includes(state.confirmed.status);
}
export function reviewIsCurrentV2(state: EditorV2State) {
  return !state.dirty && Boolean(state.confirmed?.reviewedContentHash && state.confirmed.reviewedContentHash === state.confirmed.contentHash);
}
export function draftFromRouteV2(route: V2BoundRouteDefinition): EditorV2Draft {
  const parsed = V2BoundRouteDefinitionSchema.parse(route);
  return structuredClone({ package: parsed.definition, bindings: parsed.bindings });
}
export function createEditorV2State(input: { route?: V2BoundRouteDefinition; draft?: EditorV2Draft }): EditorV2State {
  if (!input.route && !input.draft) throw new Error("A v2 editor needs an explicit draft or confirmed route");
  return {
    engineVersion: "guided-v2", draft: input.route ? draftFromRouteV2(input.route) : structuredClone(input.draft!),
    confirmed: input.route ? V2BoundRouteDefinitionSchema.parse(input.route) : null,
    confirmedAt: null, dirty: !input.route, localRevision: 0, section: "sources", operation: "idle", conflict: false, notice: "",
  };
}
/** Keys are portable authoring identities, never catalogue UUIDs. */
export function nextLocalKeyV2(prefix: string, keys: Iterable<string>) {
  const used = new Set(keys);
  const safePrefix = prefix.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100) || "item";
  let index = 1;
  while (used.has(`${safePrefix}-${index}`)) index += 1;
  return `${safePrefix}-${index}`;
}
