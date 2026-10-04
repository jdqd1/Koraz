import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { studentFixture, fixtureId } from "./fixtures";
import { V2PublicPathSchema, V2RouteStateSchema } from "@cediah/contracts";
import { actionLabel, actionTarget, mergeCards, routeHref, stateMatches } from "./model";
import { V2PathScreen } from "./path-screen";
import { LearningPathCard } from "../learning-path-card";
import { LearningHomeScreen } from "../learning-home-screen";
import { V2SessionEntry } from "./session-entry";
import { learningVisualPaths } from "../learning-visual-fixtures";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

describe("T028 shared learner state", () => {
  it("keeps consumption, mastery, consolidation and due review independent on every surface", () => {
    const f = studentFixture("completed");
    const surfaces = [renderToString(<V2PathScreen path={f.path} state={f.state} />), renderToString(<LearningHomeScreen available home={null} homeAvailable paths={[f.card]} progress={[]} tab="progreso" v2States={[f.state]} />), renderToString(<LearningHomeScreen available home={null} homeAvailable paths={[f.card]} progress={[]} tab="hoy" v2Home={f.home} v2States={[f.state]} />), renderToString(<V2SessionEntry attempt={f.attempt} state={f.state} />), renderToString(<LearningPathCard path={f.card} />)];
    for (const html of surfaces) { expect(html).toContain("Recorrido completado"); expect(html).toContain("Dominio por comprobar"); expect(html).toContain("Consolidación pendiente"); expect(html).not.toContain("Dominio alcanzado"); }
  });
  it("retains previous achievement while displaying current critical reinforcement and blocker", () => {
    const f = studentFixture("critical"), html = renderToString(<V2PathScreen path={f.path} state={f.state} />);
    for (const text of ["Dominio alcanzado", "Necesita refuerzo", "Dominio previo conservado", "error esencial", f.state.nextAction.reason]) expect(html).toContain(text);
    expect(html).not.toContain("Completada</");
  });
  it("due reviews offer Repasar without inventing a due date or rewarding a view", () => {
    const f = studentFixture("review"), html = renderToString(<V2PathScreen path={f.path} state={f.state} />);
    expect(html.replace(/<!--.*?-->/g, "")).toContain("2 repasos pendientes"); expect(html).toContain("Repasar"); expect(html).not.toContain("autocalific");
  });
  it("rejects state belonging to a different enrollment or adopted version", () => {
    const f = studentFixture();
    expect(stateMatches(f.path, V2RouteStateSchema.parse({ ...f.state, enrollmentId: fixtureId(66) }))).toBe(false);
    const otherPath = V2PublicPathSchema.parse({ ...f.path, pathVersionId: fixtureId(67) });
    expect(stateMatches(otherPath, f.state)).toBe(false);
    const html = renderToString(<V2PathScreen path={otherPath} state={f.state} />);
    expect(html).toContain("No pudimos cargar el estado confirmado"); expect(html).not.toContain("Continuar</button>");
  });
  it("preserves pinned v1 enrollment and gives v2 priority only when enrolled or unenrolled", () => {
    const v1 = learningVisualPaths[0]!, f = studentFixture();
    const id = f.card.id;
    expect(mergeCards([{ ...v1, id }], [{ ...f.card, enrollmentId: null }])[0]).toMatchObject({ enrollment: v1.enrollment });
    expect(mergeCards([{ ...v1, id, enrollment: null }], [f.card])[0]).toEqual(f.card);
  });
  it("keeps v1 card markup and distinguishes missing/revoked state from zeros", () => {
    expect(renderToString(<LearningPathCard path={learningVisualPaths[0]!} />)).toContain("min aprox.");
    const f = studentFixture("revoked"); expect(renderToString(<V2PathScreen path={f.path} state={null} />)).toContain("Tu historial se conserva");
    expect(renderToString(<V2PathScreen path={studentFixture().path} state={null} />)).not.toContain("0 repasos");
  });
  it("renders empty units and does not make a none action launchable", () => {
    const f = studentFixture("empty"); expect(renderToString(<V2PathScreen path={f.path} state={null} />)).toContain("no tiene unidades disponibles");
    const none = studentFixture("none"); const html = renderToString(<V2PathScreen path={none.path} state={none.state} />); expect(html).toContain(none.state.nextAction.reason); expect(html).not.toContain("Continuar</button>");
  });
  it("maps server-selected action kinds and encodes only safe map return URLs", () => {
    const f = studentFixture(); expect(actionTarget(f.state.nextAction)).toEqual({ kind: "activity", key: "practice-a" });
    expect(actionTarget({ kind: "retention", key: "retention7", reason: "Due" })).toEqual({ kind: "assessment", key: "retention7" });
    expect(actionTarget(studentFixture("resume").state.nextAction)).toBeNull();
    expect(actionLabel(studentFixture("review").state.nextAction)).toBe("Repasar");
    expect(routeHref("a/b", "unit", "https://evil.test")).toBe("/aprendizaje/rutas/a%2Fb?leccion=unit");
    expect(routeHref("route", undefined, "/aprendizaje/mapa")).toContain("returnTo=%2Faprendizaje%2Fmapa");
  });
});
