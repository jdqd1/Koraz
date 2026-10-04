import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { studentFixture, fixtureId } from "./fixtures";
import { V2ReviewScreen } from "./review";
import { MaintenanceDate, formatMaintenanceDate } from "./maintenance";
import { createV2Launcher } from "./client";
import { V2HttpContracts } from "@cediah/contracts";
import { maintenanceFixture } from "./maintenance-fixtures";
import { authorizedMaintenanceTarget } from "./route-action";

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
    expect(html).not.toContain("Consolidación alcanzada");
    expect(html).not.toContain("</button>");
  });
  it("shows server consolidation dates rather than deriving a new achievement", () => {
    const fixture = studentFixture("consolidated");
    const html = renderToString(<V2ReviewScreen path={fixture.path} state={fixture.state} />);
    expect(html).toContain(`dateTime="${fixture.state.consolidatedAt}"`);
    expect(html).toContain("Consolidación alcanzada:");
    expect(renderToString(<V2ReviewScreen path={fixture.path} state={{ ...fixture.state, consolidatedAt: null }} />)).toContain("Consolidación pendiente de evidencia diferida");
  });
  it("formats midnight boundaries in the requested zone without changing the instant", () => {
    const value = "2026-10-04T02:30:00.000Z";
    expect(formatMaintenanceDate(value, "America/Caracas")).toContain("3 de octubre");
    expect(formatMaintenanceDate(value, "UTC")).toContain("4 de octubre");
    const html = renderToString(<MaintenanceDate value={value} timeZone="America/Caracas" />);
    expect(html).toContain(`dateTime="${value}"`);
    expect(html).toContain("America/Caracas");
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
    expect(html).not.toContain("Repasar objetivo 1</button>"); expect(html).not.toContain("Practicar este objetivo</button>");
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
