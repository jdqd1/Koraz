import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { studentFixture, fixtureId } from "./fixtures";
import { maintenanceFixture } from "./maintenance-fixtures";
import { RouteCurriculum, CurriculumResources } from "./curriculum";
import { actionLocation, unitActivityProgress, unitRecommendation } from "./curriculum-model";
import { V2MapPanel } from "./map-panel";
import { RouteReason } from "./route-reason";
import { ROOT_MAP_ROUTE } from "../map/map-route";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

describe("unit and objective curriculum", () => {
  it("shows only the selected unit and its objective's activities without changing progress", () => {
    const fixture = studentFixture();
    const before = JSON.stringify(fixture.state);
    const html = renderToStaticMarkup(<RouteCurriculum path={fixture.path} state={fixture.state} focusUnit="unit-a" unitOnly />);
    expect(html).toContain('aria-label="Actividades de Explicar la relación entre los conceptos A y B"');
    expect(html).toContain("Leer y comprender");
    expect(html).toContain("Relacionar conceptos");
    expect(html).toContain("Elegir la respuesta correcta");
    expect(html).not.toContain("Resolver un caso");
    expect(html).not.toContain("Comparar dos situaciones nuevas");
    expect(html).toContain('aria-current="step"');
    expect(JSON.stringify(fixture.state)).toBe(before);
  });
  it("keeps per-unit consumption separate from whole-route mastery and displays missing data honestly", () => {
    const fixture = studentFixture();
    expect(unitActivityProgress(fixture.path.units[0]!, fixture.state)).toEqual({ total: 3, completed: 2, covered: 0 });
    expect(unitActivityProgress(fixture.path.units[1]!, fixture.state)).toEqual({ total: 3, completed: 0, covered: 0 });
    expect(unitActivityProgress(fixture.path.units[0]!, { ...fixture.state, activityProgress: undefined })).toBeNull();
    expect(unitActivityProgress(fixture.path.units[0]!, null)).toBeNull();
    const html = renderToStaticMarkup(<RouteCurriculum path={fixture.path} state={{ ...fixture.state, activityProgress: undefined }} />);
    expect(html).toContain("Estado por cargar");
    expect(html).not.toContain("Completada</span>");
  });
  it("keeps activities separated when a unit has more than one objective", () => {
    const fixture = studentFixture();
    const first = fixture.path.units[0]!, second = fixture.path.units[1]!;
    const path = { ...fixture.path, units: [{ ...first, objectives: [...first.objectives, ...second.objectives], activities: [...first.activities!, ...second.activities!] }] };
    const html = renderToStaticMarkup(<RouteCurriculum path={path} state={fixture.state} />);
    const groups = html.match(/<section[^>]*aria-label="Objetivo:[\s\S]*?<\/section>/g)!;
    expect(groups).toHaveLength(2);
    expect(groups[0]).toContain("Relacionar conceptos");
    expect(groups[0]).not.toContain("Resolver un caso");
    expect(groups[1]).toContain("Resolver un caso");
    expect(groups[1]).not.toContain("Relacionar conceptos");
  });
  it("joins recommendations to their unit and opens the recommended unit initially", () => {
    const fixture = studentFixture();
    const state = { ...fixture.state, nextAction: { ...fixture.state.nextAction, key: "practice-b" }, nextActionContext: { unitKey: "unit-b", objectiveKey: "objective-b" } };
    expect(actionLocation(fixture.path, state).unit?.key).toBe("unit-b");
    const html = renderToStaticMarkup(<RouteCurriculum path={fixture.path} state={state} />);
    expect(html).toMatch(/id="leccion-unit-b"[^>]*open=""/);
    expect(html).not.toMatch(/id="leccion-unit-a"[^>]*open=""/);
  });
  it("offers an authorized activity of the selected unit and never bypasses an open session", () => {
    const fixture = maintenanceFixture();
    const unit = fixture.path.units[1]!;
    expect(unitRecommendation(fixture.path, fixture.state, unit)?.target).toEqual({ kind: "activity", key: "practice-b" });
    const resume = { ...fixture.state, nextAction: { kind: "resume" as const, key: fixtureId(4), reason: "Sesión pendiente" } };
    expect(unitRecommendation(fixture.path, resume, unit)).toMatchObject({ kind: "resume", target: undefined, unit: { key: "unit-a" } });
    expect(unitRecommendation(fixture.path, { ...fixture.state, maintenance: undefined }, unit)).toBeNull();
  });
  it("keeps revoked, maintenance, missing and mismatched state unlaunchable", () => {
    const fixture = maintenanceFixture();
    for (const [path, state] of [[{ ...fixture.path, access: "revoked" as const }, fixture.state], [fixture.path, { ...fixture.state, availability: "maintenance" as const }], [fixture.path, null], [fixture.path, { ...fixture.state, pathVersionId: fixtureId(66) as typeof fixture.state.pathVersionId }]] as const) {
      const html = renderToStaticMarkup(<RouteCurriculum path={path} state={state} />);
      expect(html).not.toContain("Abrir actividad</button>");
      expect(html).not.toContain('aria-current="step"');
    }
  });
  it("keeps resource references in their own unit and does not invent missing links", () => {
    const fixture = studentFixture();
    const first = renderToStaticMarkup(<CurriculumResources path={fixture.path} focusUnit="unit-a" unitOnly />);
    expect(first).toContain('href="https://example.test/source-a"');
    expect(first).toContain("Página 2");
    const second = renderToStaticMarkup(<CurriculumResources path={fixture.path} focusUnit="unit-b" unitOnly />);
    expect(second).not.toContain("source-a");
    expect(second).toContain("no tiene recursos de referencia asociados");
  });
  it("shows the selected unit count without including overall route progress", () => {
    const fixture = studentFixture();
    const html = renderToStaticMarkup(<V2MapPanel meta={{ ...fixture, unitKey: "unit-b" }} route={ROOT_MAP_ROUTE} onClose={() => {}} />);
    expect(html).toContain("0 de 3 completadas");
    expect(html).not.toContain("2 actividades completadas de 6");
    expect(html).not.toContain("Progreso de la ruta");
    expect(html).toContain("Otra unidad");
    expect(html).toContain("Contenido de la unidad");
  });
  it("formats UTC reasons for people and retains the exact instant", () => {
    const instant = "2026-10-14T05:00:14.480Z";
    const html = renderToStaticMarkup(<RouteReason reason={`La próxima comprobación será después de ${instant}`} timeZone="America/Caracas" />);
    expect(html).toContain(`dateTime="${instant}"`);
    expect(html).toContain("14 oct");
    expect(html).not.toContain(`>${instant}<`);
  });
});
