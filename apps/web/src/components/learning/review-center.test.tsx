import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ReviewCenter, reviewCategories } from "./review-center";
import { maintenanceFixture } from "./v2/maintenance-fixtures";
import { LearningHomeSchema } from "@cediah/contracts";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
export function reviewHome(count = 12) {
  return LearningHomeSchema.parse({ activePath: null, constancy: { activeDaysThisWeek: 0, weeklyGoalDays: null },
    counts: { activePaths: 0, dueReviews: count, pendingEssentialSteps: 0 }, generatedAt: "2026-10-04T02:30:00Z",
    points: 0, policyVersion: "recommendations-v1", tasks: [], preferences: { rowVersion: 0, timezone: "America/Caracas",
      sessionMinutes: 10, weeklyGoalDays: null, pinnedEnrollmentId: null, examDate: null, pendingConstancy: null } });
}

describe("F03 common review center", () => {
  it("separates items from objectives and explains the capped, estimated block", () => {
    const fixture = maintenanceFixture("review");
    const html = renderToStaticMarkup(<ReviewCenter home={reviewHome()} routes={[fixture]} unavailable={false} minutes={20} />);
    expect(html).toContain("12 ítems pendientes");
    expect(html).toContain("al menos 2 ítems");
    expect(html).toContain("unos 20 min");
    expect(html).toContain("1 objetivo pendiente");
    expect(html.match(/<main\b/g)).toHaveLength(1);
  });
  it("resumes the existing V1 review instead of offering a second block", () => {
    const home = reviewHome();
    home.tasks.push({ kind: "resume", key: "review-session:one", href: "/aprendizaje/sesiones/one", band: 0,
      dueAt: null, enrollmentId: null, estimatedMinutes: null, importance: 3, itemCount: 0, reason: "Retomar", taskKeys: ["review-session:one"], title: "Repaso" });
    const html = renderToStaticMarkup(<ReviewCenter home={home} routes={[]} unavailable={false} minutes={10} />);
    expect(html).toContain('href="/aprendizaje/sesiones/one"');
    expect(html).not.toContain("Comenzar ·");
  });
  it("keeps the V2 server recommendation while an attempt is open", () => {
    const fixture = maintenanceFixture("review");
    fixture.state.nextAction = { kind: "resume", key: "open", reason: "Reanudar el intento abierto" };
    const html = renderToStaticMarkup(<ReviewCenter home={reviewHome(0)} routes={[fixture]} unavailable={false} minutes={10} />);
    expect(html).toContain("Retoma tu sesión abierta");
    expect(html).not.toContain(">Repasar</button>");
  });
  it("does not present missing or mismatched state as an empty queue", () => {
    const fixture = maintenanceFixture("review");
    fixture.path.enrollmentId = null;
    const html = renderToStaticMarkup(<ReviewCenter home={null} routes={[fixture]} unavailable minutes={10} />);
    expect(html).toContain("No pudimos consultar todas");
    expect(html).toContain("No pudimos confirmar el estado");
    expect(html).not.toContain("0 objetivos pendientes");
    expect(html).not.toContain("0 ítems pendientes");
  });
  it("uses server time and requires the first retention measurement before the second", () => {
    const { state } = maintenanceFixture("review");
    state.maintenance.generatedAt = "2026-12-01T00:00:00Z";
    expect(reviewCategories(state)).toEqual({ maintenance: 1, seven: 1, thirty: 0 });
    state.maintenance.agenda[0]!.retention7.acceptedAt = "2026-11-01T00:00:00Z";
    expect(reviewCategories(state)).toEqual({ maintenance: 1, seven: 0, thirty: 1 });
    state.maintenance.generatedAt = "2026-10-02T00:00:00Z";
    expect(reviewCategories(state)).toEqual({ maintenance: 0, seven: 0, thirty: 0 });
  });
});
