import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LearningHomeSchema } from "@cediah/contracts";
import { learningVisualHome } from "./learning-visual-fixtures";
import { studentFixture, fixtureId } from "./v2/fixtures";
import { LearningDashboardSummary } from "./learning-dashboard-summary";
import { LearningDashboardRoutes } from "./learning-dashboard-routes";
import { LearningHomeScreen } from "./learning-home-screen";
import { LearningPoints } from "./v2/motivation";
import { maintenanceFixture } from "./v2/maintenance-fixtures";
import { requiredActivityLabel, v1RouteSummary, v2RouteSummary } from "./route-summary";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

describe("F05 confirmed route summaries", () => {
  it("marks the actual completed IDs and keeps recommendations within the announced enrollment", () => {
    const home = structuredClone(learningVisualHome);
    home.activePath = { ...home.activePath!, completedSteps: 1, totalSteps: 3, progressPercent: 33,
      steps: [1, 2, 3].map(n => ({ id: fixtureId(n), title: `Paso ${n}`, state: n === 3 ? "completed" : "not_started" })) };
    home.tasks = [{ ...home.tasks[0]!, title: "Otra matrícula", kind: "step", enrollmentId: fixtureId(90) }];
    const html = renderToStaticMarkup(<LearningDashboardSummary available enabled home={home} />);
    expect(html).toContain("Paso 3: completada");
    expect(html).toContain("Paso 1: pendiente");
    expect(html).not.toContain("Otra matrícula");
    expect(html).not.toContain("Ruta completada.");
    expect(html).toContain("1 de 3 actividades obligatorias completadas");
  });
  it("accepts old snapshots without inventing per-activity completion or mastery", () => {
    const home = LearningHomeSchema.parse(learningVisualHome);
    const summary = v1RouteSummary(home.activePath!);
    expect(summary).toMatchObject({ steps: null, mastery: null, consolidation: null, covered: null });
    expect(renderToStaticMarkup(<LearningDashboardSummary available enabled home={home} />)).not.toContain("Progreso por actividades");
  });
  it("separates completed, covered and optional work from evidence and XP", () => {
    const { state } = studentFixture();
    const summary = v2RouteSummary({ ...state, completedActivities: 2, dispensedActivities: 3, plannedRequiredActivities: 6,
      masteredAt: null, consolidatedAt: null });
    expect(requiredActivityLabel(summary)).toBe("2 de 6 actividades obligatorias completadas");
    expect(summary).toMatchObject({ covered: 3, mastery: false, consolidation: false });
  });
  it("shows only-V2 routes and total points without a false onboarding empty state", () => {
    const { state, card, home: v2Home } = studentFixture();
    const home = { ...learningVisualHome, activePath: null, tasks: [] };
    expect(renderToStaticMarkup(<LearningDashboardSummary available enabled home={home} hasOtherRoutes />)).toBe("");
    const dashboard = renderToStaticMarkup(<LearningDashboardRoutes routes={[{ card, state }]} unavailable={false} />);
    expect(dashboard).toContain(card.title);
    expect(dashboard).toContain(`/aprendizaje/rutas/${card.slug}`);
    const progress = renderToStaticMarkup(<LearningHomeScreen available homeAvailable home={home} paths={[card]} progress={[]} tab="progreso" v2Home={v2Home} v2States={[state]} />);
    expect(progress).toContain("Puntos de aprendizaje");
    expect(progress).not.toContain("Todavía no hay avance");
    const today = renderToStaticMarkup(<LearningHomeScreen available homeAvailable home={home} paths={[card]} progress={[]} tab="hoy" v2Home={v2Home} v2States={[state]} />);
    expect(today).not.toContain("Empieza con una ruta");
  });
  it("does not announce an unrelated unit's diagnostic XP goal", () => {
    const { path, state } = studentFixture();
    state.maintenance = maintenanceFixture().state.maintenance;
    state.motivation = { totalXp: 0, routeXp: 0, extraToday: 0, practiceOffers: [],
      rules: { firstRecall: 5, mastery: 10, consolidation: 15, practice: 2, recovery: 5, dailyLimit: 20 } };
    state.maintenance.placements = [{ objectiveKey: path.units[1]!.objectives[0]!.key,
      status: "xp_required", requiredXp: 20, remainingXp: 20, assessmentKey: null,
      prerequisiteKeys: [], missingObjectiveKeys: [], availableAfter: null }];
    const html = renderToStaticMarkup(<LearningPoints path={path} state={state} unitKey={path.units[0]!.key} />);
    expect(html).not.toContain("XP para habilitar el diagnóstico");
  });
});
