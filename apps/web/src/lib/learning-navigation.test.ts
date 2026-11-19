import { describe, expect, it } from "vitest";
import { learningRouteHref, learningSessionHref, resolveLearningContext, safeLearningReturnHref } from "./learning-navigation";
import { buildMapHref } from "@/components/learning/map/map-route";

describe("learning navigation context", () => {
  it("round trips a selected unit, objective, activity, tab and map origin", () => {
    const origin = buildMapHref({ nodeId: "77000000-0000-4000-8000-000000000001", entryId: null, unitStableKey: "unit" }, true);
    const href = learningRouteHref("route", { unit: "unit", objective: "objective", activity: "activity", tab: "resources", origin });
    expect(safeLearningReturnHref(href)).toBe(href);
    const session = new URL(learningSessionHref("attempt", href), "https://local.test");
    expect(session.searchParams.get("returnTo")).toBe(href);
  });
  it.each([
    "https://evil.test/aprendizaje/rutas/route", "//evil.test", "/aprendizaje/rutas/route\\evil", "/aprendizaje/rutas/%2e%2e/route",
    "/aprendizaje/rutas/route?returnTo=https%3A%2F%2Fevil.test", "/aprendizaje/rutas/route?returnTo=%2Faprendizaje%2Frutas%2Fother",
    "/aprendizaje/rutas/route?leccion=a&leccion=b", "/aprendizaje/rutas/route?leccion=a#actividad-b", "/aprendizaje/rutas/route?userId=other",
    "/aprendizaje/rutas/route?actividad=%0Aevil", "/aprendizaje/rutas/route?pestana=invalid", "/aprendizaje/mapa?detail=2", "/aprendizaje/mapa?unit=a&unit=b",
  ])("rejects unsafe or ambiguous return: %s", href => expect(safeLearningReturnHref(href)).toBeNull());
  const units = [{ key: "first", objectives: ["o1"], activities: [{ key: "a1", objective: "o1" }] }, { key: "second", objectives: ["o2"], activities: [{ key: "a2", objective: "o2" }] }];
  it("recovers removed keys with an explanation without opening a different unit's activity", () => {
    expect(resolveLearningContext({ leccion: "removed", actividad: "a2" }, units)).toMatchObject({ context: { unit: "second", activity: "a2", objective: "o2" }, notice: expect.any(String) });
    expect(resolveLearningContext({ leccion: "first", actividad: "a2", objetivo: "o2" }, units)).toMatchObject({ context: { unit: "first", activity: undefined, objective: undefined }, notice: expect.any(String) });
    expect(resolveLearningContext({ actividad: "a2" }, units)).toMatchObject({ context: { unit: "second", activity: "a2", objective: "o2" }, notice: null });
  });
  it("treats duplicate query values as untrusted input", () => {
    expect(() => resolveLearningContext({ returnTo: ["/aprendizaje/mapa", "//evil.test"] } as never, units)).not.toThrow();
  });
});
