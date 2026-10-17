import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { studentFixture, fixtureId } from "./fixtures";
import { V2ReviewScreen } from "./review";
import { MaintenanceDate, formatMaintenanceDate, formatFriendlyMaintenanceDate } from "./maintenance";
import { PlatformTimeZone } from "../../user-time-zone";
import { createV2Launcher } from "./client";
import { V2HttpContracts } from "@cediah/contracts";
import { maintenanceFixture } from "./maintenance-fixtures";
import { authorizedMaintenanceTarget } from "./route-action";
import { ObjectivePlacement, DiagnosticPanel } from "./diagnostic";
import { actionTarget } from "./model";
import { LearningPoints } from "./motivation";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

describe("T032 confirmed maintenance presentation", () => {
  it("keeps current reinforcement and historical mastery separate", () => {
    const fixture = studentFixture("critical");
    const before = JSON.stringify(fixture.state);
    const html = renderToString(<V2ReviewScreen path={fixture.path} state={fixture.state} />);
    expect(html).toContain("Dominio previo conservado");
    expect(html).toContain("Refuerza el objetivo esencial");
    expect(html).toContain("Explicar la relación entre los conceptos A y B");
    expect(html).toContain("Reforzar</button>");
    expect(JSON.stringify(fixture.state)).toBe(before);
  });
  it("offers confirmed review and continuing without declaring a queue completed", () => {
    const fixture = studentFixture("review");
    const html = renderToString(<V2ReviewScreen path={fixture.path} state={fixture.state} />);
    expect(html).toContain("2 objetivos pendientes de repaso");
    expect(html).toContain("Repasar</button>");
    expect(html).toContain("sin vaciar todos los repasos");
    expect(html).not.toContain("Repaso completado");
    expect(html).toContain("Un repaso pendiente no significa que hayas fallado");
  });
  it("does not invent missing schedules, diagnosis targets or unlocks", () => {
    const fixture = studentFixture("none");
    const html = renderToString(<V2ReviewScreen path={fixture.path} state={fixture.state} />);
    expect(html).toContain(fixture.state.nextAction.reason);
    expect(html).toContain("próximas fechas");
    expect(html).toContain("Actualiza la ruta");
    expect(html).toContain("opciones del diagnóstico");
    expect(html).not.toContain("Continuar</button>");
    expect(html).not.toContain("Comenzar diagnóstico</button>");
    expect(html).toContain("Consultar otras rutas");
  });
  it.each(["missing", "foreign", "revoked"])("rejects %s state before showing dates, counters or start controls", mode => {
    const fixture = studentFixture(mode === "revoked" ? mode : "consolidated");
    const state = mode === "missing" ? null : mode === "foreign" ? { ...fixture.state, pathVersionId: fixtureId(777) as typeof fixture.state.pathVersionId } : fixture.state;
    const html = renderToString(<V2ReviewScreen path={fixture.path} state={state} />);
    expect(html).toContain("Estado por confirmar");
    expect(html).not.toContain("<time");
    expect(html).not.toContain("Recordado en los repasos");
    expect(html).not.toContain("</button>");
  });
  it("shows server consolidation dates rather than deriving a new achievement", () => {
    const fixture = studentFixture("consolidated");
    const html = renderToString(<V2ReviewScreen path={fixture.path} state={fixture.state} />);
    expect(html).toContain(`dateTime="${fixture.state.consolidatedAt}"`);
    expect(html).toContain("Recordado en los repasos:");
    expect(renderToString(<V2ReviewScreen path={fixture.path} state={{ ...fixture.state, consolidatedAt: null }} />)).toContain("Los próximos repasos comprobarán qué recuerdas con el tiempo");
  });
  it("formats midnight boundaries in the requested zone without changing the instant", () => {
    const value = "2026-10-04T02:30:00.000Z";
    expect(formatMaintenanceDate(value, "America/Caracas")).toContain("3 de octubre");
    expect(formatMaintenanceDate(value, "UTC")).toContain("4 de octubre");
    const html = renderToString(<MaintenanceDate value={value} timeZone="America/Caracas" />);
    expect(html).toContain(`dateTime="${value}"`);
    expect(html).toContain("America/Caracas");
  });
  it("uses the server reference day for friendly dates in each country", () => {
    const reference = "2026-10-14T02:00:00Z", dueAt = "2026-10-14T05:20:00Z";
    expect(formatFriendlyMaintenanceDate(dueAt, "America/Caracas", reference)).toMatch(/^mañana a la 1:20/);
    expect(formatFriendlyMaintenanceDate(dueAt, "Europe/Madrid", reference)).toMatch(/^hoy a las 7:20/);
    expect(formatFriendlyMaintenanceDate("2027-01-04T05:20:00Z", "America/Caracas", reference)).toContain("2027");
    const html = renderToString(<MaintenanceDate value={dueAt} timeZone="America/Caracas" relativeTo={reference} friendly />);
    expect(html).toContain(`dateTime="${dueAt}"`);
    expect(html).toContain("mañana a la 1:20");
  });
  it("keeps the administration on Venezuela time independently of a learner's saved zone", () => {
    const value = "2026-10-14T02:30:00Z";
    const admin = renderToString(<PlatformTimeZone><MaintenanceDate value={value} timeZone="Europe/Madrid" /></PlatformTimeZone>);
    expect(admin).toContain('data-time-zone="America/Caracas"');
    expect(admin).toContain("13 de octubre");
    const learner = renderToString(<MaintenanceDate value={value} timeZone="Europe/Madrid" />);
    expect(learner).toContain('data-time-zone="Europe/Madrid"');
    expect(learner).toContain("14 de octubre");
  });
  it("keeps omission and retention language neutral and avoids made-up dates", () => {
    const fixture = studentFixture();
    const html = renderToString(<V2ReviewScreen path={fixture.path} state={fixture.state} />);
    expect(html).toContain("sin hacerlo");
    expect(html).toContain("no reduce tu progreso");
    expect(html).toContain("días reales");
    expect(html).not.toContain("<time");
    expect(html).not.toContain("Has fallado por no repasar");
  });
  it("opens only the current server-selected review with enrollment CAS and replay identity", async () => {
    const fixture = studentFixture("review");
    const fetcher = vi.fn().mockRejectedValueOnce(new Error("Lost receipt")).mockResolvedValue(Response.json(V2HttpContracts.attemptCreate.response.parse({ attempt: fixture.attempt })));
    const client = createV2Launcher(fetcher, () => fixtureId(90));
    const target = { kind: "review" as const, key: fixture.state.nextAction.key! };
    await expect(client.start(fixture.state, target)).rejects.toThrow("Lost receipt");
    const result = await client.start(fixture.state, target);
    expect(result.attempt).toEqual(fixture.attempt);
    expect(fetcher.mock.calls[0]).toEqual(fetcher.mock.calls[1]);
    const options = fetcher.mock.calls[1]![1];
    expect(JSON.parse(options.body)).toMatchObject({ enrollmentId: fixture.state.enrollmentId, expectedEnrollmentVersion: fixture.state.rowVersion, target });
  });
  it("offers diagnosis and omission through two distinct authorized server targets", () => {
    const fixture = maintenanceFixture();
    const html = renderToString(<V2ReviewScreen path={fixture.path} state={fixture.state} />);
    expect(html).toContain("Comenzar diagnóstico</button>"); expect(html).toContain("Aprender sin diagnóstico</button>");
    expect(authorizedMaintenanceTarget(fixture.state, { kind: "assessment", key: "diagnosis" })).toBe(true);
    expect(authorizedMaintenanceTarget({ ...fixture.state, maintenance: { ...fixture.state.maintenance, diagnostic: { status: "omitted", assessmentKey: null } } }, { kind: "assessment", key: "diagnosis" })).toBe(false);
    expect(authorizedMaintenanceTarget(fixture.state, { kind: "assessment", key: "reserve-private" })).toBe(false);
  });
  it("does not open any new offer while a server attempt must be resumed", () => {
    const fixture = maintenanceFixture("review");
    const state = { ...fixture.state, nextAction: studentFixture("resume").state.nextAction };
    for (const target of [{ kind: "activity" as const, key: "practice-b" }, { kind: "review" as const, key: "review-a" }]) expect(authorizedMaintenanceTarget(state, target)).toBe(false);
    const html = renderToString(<V2ReviewScreen path={fixture.path} state={state} />);
    expect(html).not.toContain("Repasar</button>"); expect(html).not.toContain("Practicar este objetivo</button>");
  });
  it("shows a targeted diagnostic only from the confirmed admission offer", () => {
    const fixture = maintenanceFixture();
    const objectiveKey = fixture.path.units[0]!.objectives[0]!.key;
    fixture.state.maintenance.placements = [{ objectiveKey, assessmentKey: "diagnosis", status: "available", prerequisiteKeys: ["previous"], missingObjectiveKeys: [], availableAfter: null }];
    const target = { kind: "assessment" as const, key: "diagnosis", objectiveKey };
    expect(authorizedMaintenanceTarget(fixture.state, target)).toBe(true);
    expect(actionTarget({ kind: "gate", key: "diagnosis", objectiveKey, reason: "Diagnóstico de acceso" })).toEqual(target);
    expect(authorizedMaintenanceTarget(fixture.state, { ...target, objectiveKey: "foreign" })).toBe(false);
    const html = renderToString(<ObjectivePlacement path={fixture.path} state={fixture.state} objectiveKey={objectiveKey} returnTo="/aprendizaje/mapa?unit=unit" />);
    expect(html).toContain("Hacer diagnóstico para avanzar</button>");
    fixture.state.maintenance.placements[0]!.status = "unavailable";
    expect(authorizedMaintenanceTarget(fixture.state, target)).toBe(false);
    expect(renderToString(<ObjectivePlacement path={fixture.path} state={fixture.state} objectiveKey={objectiveKey} />)).not.toContain("</button>");
    fixture.state.maintenance.placements[0]!.status = "passed";
    expect(renderToString(<ObjectivePlacement path={fixture.path} state={fixture.state} objectiveKey={objectiveKey} />)).toContain("Conocimientos previos comprobados");
  });
  it("keeps the initial diagnosis accessible after beginning the route", () => {
    const fixture = maintenanceFixture();
    fixture.state.maintenance.diagnostic = { status: "omitted", assessmentKey: "diagnosis" };
    expect(authorizedMaintenanceTarget(fixture.state, { kind: "assessment", key: "diagnosis" })).toBe(true);
    const html = renderToString(<DiagnosticPanel path={fixture.path} state={fixture.state} />);
    expect(html).toContain("aunque ya hayas comenzado");
    expect(html).toContain("Comenzar diagnóstico</button>");
  });
  it("shows confirmed XP, the remaining diagnostic requirement and rewarded repeats", () => {
    const fixture = maintenanceFixture(), objectiveKey = fixture.path.units[0]!.objectives[0]!.key;
    fixture.state.maintenance.placements = [{ objectiveKey, assessmentKey: "diagnosis", status: "xp_required", prerequisiteKeys: ["previous", "other"],
      missingObjectiveKeys: [], availableAfter: null, requiredXp: 40, remainingXp: 20 }];
    fixture.state.motivation = { totalXp: 20, routeXp: 15, extraToday: 5,
      rules: { firstRecall: 5, mastery: 10, consolidation: 15, practice: 2, recovery: 5, dailyLimit: 20 },
      practiceOffers: [{ key: "practice-a", objectiveKey, xp: 5, available: true, availableAfter: null, reason: "correct_error" }] };
    const html = renderToString(<LearningPoints path={fixture.path} state={fixture.state} />);
    expect(html).toContain("20 XP"); expect(html).toContain("Te faltan 20 XP"); expect(html).toContain("Practicar por hasta 5 XP</button>");
    expect(authorizedMaintenanceTarget(fixture.state, { kind: "assessment", key: "diagnosis", objectiveKey })).toBe(false);
    expect(authorizedMaintenanceTarget(fixture.state, { kind: "activity", key: "practice-a" })).toBe(true);
    expect(authorizedMaintenanceTarget(fixture.state, { kind: "activity", key: "private-reserve" })).toBe(false);
    const locked = renderToString(<ObjectivePlacement path={fixture.path} state={fixture.state} objectiveKey={objectiveKey} />);
    expect(locked.replaceAll("<!-- -->", "")).toContain("Te faltan 20 XP"); expect(locked).not.toContain("Hacer diagnóstico para avanzar</button>");
  });
  it("uses server time and profile zone for overdue dates, regardless of the browser clock", () => {
    vi.useFakeTimers(); vi.setSystemTime("2000-01-01T00:00:00Z");
    try {
      const fixture = maintenanceFixture("review");
      const html = renderToString(<V2ReviewScreen path={fixture.path} state={fixture.state} />);
      expect(html).toContain("Repaso pendiente desde"); expect(html).toContain("America/Caracas");
      expect(html).toContain("2 de octubre"); expect(html).toContain("hasta diez a la vez");
      expect(html).toContain("Cada objetivo abre su propia práctica");
    } finally { vi.useRealTimers(); }
  });
  it("shows accepted real retention days and waits for the first measurement before offering the second", () => {
    const fixture = maintenanceFixture("consolidated");
    const html = renderToString(<V2ReviewScreen path={fixture.path} state={fixture.state} />);
    expect(html).toContain("9,5 días reales desde el primer dominio");
    const pending = maintenanceFixture();
    expect(renderToString(<V2ReviewScreen path={pending.path} state={pending.state} />)).toContain("Disponible tras completar la primera medición");
  });
  it("keeps exhausted verification unlaunchable and provides another authorized branch with an exact date", () => {
    const fixture = maintenanceFixture("exhausted");
    const html = renderToString(<V2ReviewScreen path={fixture.path} state={fixture.state} />);
    expect(html).toContain("Confusión sintética confirmada"); expect(html).toContain("4 de octubre");
    expect(html).toContain("Practicar este objetivo</button>"); expect(html).not.toContain("Reforzar este objetivo</button>");
    expect(html).toContain("Objetivos esenciales por demostrar"); expect(html).toContain("depende de:");
    expect(authorizedMaintenanceTarget(fixture.state, { kind: "activity", key: "unlisted" })).toBe(false);
  });
});
