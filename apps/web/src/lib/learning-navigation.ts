import { safeMapReturnHref } from "@/components/learning/map/map-route";

export type LearningRouteContext = {
  unit?: string;
  objective?: string;
  activity?: string;
  tab?: "activities" | "resources";
  origin?: string | null;
};
export type LearningRouteQuery = { leccion?: string; objetivo?: string; actividad?: string; pestana?: string; returnTo?: string };
const keyPattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,199}$/;
const validKey = (key: string | undefined): key is string => !!key && keyPattern.test(key);
export function learningAnchor(context: LearningRouteContext) {
  return context.activity ? `actividad-${context.activity}` : context.objective ? `objetivo-${context.objective}` : context.unit ? `leccion-${context.unit}` : "";
}
export function safeLearningOrigin(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  return safeMapReturnHref(value) ?? (value && ["/aprendizaje", "/aprendizaje?tab=rutas", "/aprendizaje?tab=hoy", "/aprendizaje/repaso", "/dashboard"].includes(value) ? value : null);
}
export function learningRouteHref(slug: string, context: LearningRouteContext = {}) {
  const query = new URLSearchParams();
  if (validKey(context.unit)) query.set("leccion", context.unit);
  if (validKey(context.objective)) query.set("objetivo", context.objective);
  if (validKey(context.activity)) query.set("actividad", context.activity);
  if (context.tab === "resources") query.set("pestana", "resources");
  const origin = safeLearningOrigin(context.origin);
  if (origin) query.set("returnTo", origin);
  const anchor = learningAnchor(context);
  return `/aprendizaje/rutas/${encodeURIComponent(slug)}${query.size ? `?${query}` : ""}${anchor && keyPattern.test(anchor) ? `#${anchor}` : ""}`;
}
/** One route and one origin, never a recursive chain of return URLs. */
export function safeLearningReturnHref(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const origin = safeLearningOrigin(value);
  if (origin) return origin;
  if (!value || !value.startsWith("/aprendizaje/rutas/") || /[\\\s\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const url = new URL(value, "https://learning.local");
    const slug = url.pathname.match(/^\/aprendizaje\/rutas\/([a-zA-Z0-9_-]+)$/)?.[1];
    if (url.origin !== "https://learning.local" || !slug) return null;
    const allowed = ["leccion", "objetivo", "actividad", "pestana", "returnTo"];
    if ([...url.searchParams.keys()].some(key => !allowed.includes(key) || url.searchParams.getAll(key).length !== 1)) return null;
    for (const key of ["leccion", "objetivo", "actividad"]) if (url.searchParams.has(key) && !validKey(url.searchParams.get(key) ?? undefined)) return null;
    if (url.searchParams.has("pestana") && !["activities", "resources"].includes(url.searchParams.get("pestana")!)) return null;
    if (url.searchParams.has("returnTo") && !safeLearningOrigin(url.searchParams.get("returnTo"))) return null;
    const context = contextFromQuery(Object.fromEntries(url.searchParams));
    if (url.hash && url.hash !== `#${learningAnchor(context)}`) return null;
    return learningRouteHref(slug, context);
  } catch { return null; }
}
export function contextFromQuery(query: LearningRouteQuery): LearningRouteContext {
  return { unit: typeof query.leccion === "string" ? query.leccion : undefined, objective: typeof query.objetivo === "string" ? query.objetivo : undefined, activity: typeof query.actividad === "string" ? query.actividad : undefined, tab: query.pestana === "resources" ? "resources" : "activities", origin: safeLearningOrigin(query.returnTo) };
}
export type LearningNavigationUnit = { key: string; objectives: string[]; activities: { key: string; objective?: string }[] };
export function resolveLearningContext(query: LearningRouteQuery, units: LearningNavigationUnit[]) {
  const requested = contextFromQuery(query);
  const activityUnit = units.find(unit => unit.activities.some(activity => activity.key === requested.activity));
  const objectiveUnit = units.find(unit => unit.objectives.includes(requested.objective ?? ""));
  const unit = units.find(unit => unit.key === requested.unit) ?? activityUnit ?? objectiveUnit;
  const activity = unit?.activities.find(activity => activity.key === requested.activity);
  const objective = unit?.objectives.find(key => key === requested.objective) ?? activity?.objective;
  const context: LearningRouteContext = { unit: unit?.key, objective, activity: activity?.key, tab: requested.tab, origin: requested.origin };
  const changed = !!(requested.unit && requested.unit !== context.unit || requested.objective && requested.objective !== context.objective || requested.activity && requested.activity !== context.activity || query.pestana && !["activities", "resources"].includes(query.pestana));
  return { context, notice: changed ? "El lugar que abriste cambió en esta versión. Puedes continuar desde las unidades disponibles; tu progreso se conserva." : null };
}
export function learningSessionHref(attemptId: string, returnTo?: string | null) {
  const safe = safeLearningReturnHref(returnTo);
  return `/aprendizaje/sesiones/${encodeURIComponent(attemptId)}${safe ? `?${new URLSearchParams({ returnTo: safe })}` : ""}`;
}
export function learningReturnLabel(href: string) {
  return href.startsWith("/aprendizaje/rutas/") ? "Volver a la unidad" : href.startsWith("/aprendizaje/mapa") ? "Volver al mapa" : href === "/aprendizaje/repaso" ? "Volver al repaso" : "Volver al aprendizaje";
}
