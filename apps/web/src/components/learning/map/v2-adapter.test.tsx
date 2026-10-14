import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { createV2MapClient, projectV2MapUnit, v2MapGroup, v2MapItem, v2MapLevel, v2MapSummary } from "./v2-adapter";
import { V2RequestError } from "../v2/client";
import { fixtureMapBase, studentFixture } from "../v2/fixtures";
import { ROOT_MAP_ROUTE } from "./map-route";
import { LearningMapItem } from "./nodes/learning-map-item";
import { V2MapPanel } from "../v2/map-panel";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
function reader(mode = "ready") { const f = studentFixture(mode); return { cards: vi.fn().mockResolvedValue([f.card]), state: vi.fn().mockResolvedValue(f.state), path: vi.fn().mockResolvedValue(f.path) }; }
describe("T028 map projection", () => {
  it("switches units from the same confirmed snapshot without projecting another route or an unknown unit", async () => {
    const fixture = studentFixture(), source = reader();
    const route = { nodeId: fixture.card.id, entryId: fixture.card.id, unitStableKey: null };
    const level = await createV2MapClient(fixtureMapBase(), source).level(route);
    const unit = projectV2MapUnit(level, { ...route, unitStableKey: "unit-b" })!;
    expect(v2MapLevel(unit)?.unitKey).toBe("unit-b");
    expect(v2MapLevel(unit)?.state).toBe(v2MapLevel(level)?.state);
    expect(v2MapLevel(unit)?.path).toBe(v2MapLevel(level)?.path);
    expect(projectV2MapUnit(unit, route)?.route).toEqual(route);
    expect(projectV2MapUnit(level, { ...route, entryId: null })).toBeNull();
    expect(projectV2MapUnit(level, { ...route, unitStableKey: "missing" })).toBeNull();
    expect(projectV2MapUnit(null, route)).toBeNull();
    expect(source.path).toHaveBeenCalledTimes(1);
    expect(source.state).toHaveBeenCalledTimes(1);
  });
  it("retains topic navigation and reads the same confirmed state at root, block and unit", async () => {
    const f = studentFixture("critical"), base = fixtureMapBase("critical"), source = reader("critical"), client = createV2MapClient(base, source);
    const root = await client.level(ROOT_MAP_ROUTE); expect(root.items[0]!.kind).toBe("node"); expect(v2MapGroup(root.items[0]!)![0]!.state).toEqual(f.state);
    const topic = await client.level({ nodeId: root.items[0]!.occurrenceId, entryId: null, unitStableKey: null }); expect(v2MapItem(topic.items[0]!)!.state).toEqual(f.state);
    const route = { nodeId: root.items[0]!.occurrenceId, entryId: f.card.id, unitStableKey: "unit-a" };
    const unit = await client.level(route); expect(v2MapLevel(unit)!.state).toEqual(f.state); expect(unit.items[0]!.progress.percentage).toBeNull(); expect(unit.items[0]!.progress.status).not.toBe("completed");
    expect(v2MapSummary(v2MapItem(unit.items[0]!)!)).toContain("refuerzo pendiente");
    const panel = renderToString(<V2MapPanel meta={v2MapLevel(unit)!} route={route} onClose={() => {}} />); expect(panel).toContain("Hay un concepto esencial por reforzar"); expect(panel).toContain("Por reforzar"); expect(panel).toContain("returnTo=");
  });
  it("map buttons are navigation only and never expose a completion checkbox", async () => {
    const client = createV2MapClient(fixtureMapBase("completed"), reader("completed")); const root = await client.level(ROOT_MAP_ROUTE);
    const topic = await client.level({ nodeId: root.items[0]!.occurrenceId, entryId: null, unitStableKey: null }); const item = topic.items[0]!;
    const html = renderToString(<LearningMapItem data={{ item, selected: false, selecting: false, organizing: false, onOpen: () => {}, onAction: () => {}, onPrefetch: () => () => {} }} />);
    expect(html).toContain("Por comprobar"); expect(html).not.toContain('type="checkbox"'); expect(html).not.toContain("Completar bloque");
  });
  it("blocks v2 completion mutations while preserving existing layout and v1 operations", async () => {
    const f = studentFixture(), base = fixtureMapBase(), mutate = vi.fn().mockResolvedValue({}); const client = createV2MapClient({ ...base, mutate }, reader());
    await expect(client.mutate("complete-block", { entryId: f.card.id }, "key")).rejects.toThrow("no acredita"); expect(mutate).not.toHaveBeenCalled();
    await client.mutate("complete-block", { entryId: "v1-id" }, "key"); await client.mutate("layout", { positions: [] }, "key"); expect(mutate).toHaveBeenCalledTimes(2);
  });
  it("keeps disabled v2 identical to v1 and surfaces outages rather than zeroing progress", async () => {
    const base = fixtureMapBase(), source = reader(); source.cards.mockRejectedValue(new V2RequestError(403)); const client = createV2MapClient(base, source);
    expect(await client.level(ROOT_MAP_ROUTE)).toEqual(await base.level(ROOT_MAP_ROUTE));
    source.cards.mockRejectedValue(new V2RequestError(503)); await expect(client.level(ROOT_MAP_ROUTE)).rejects.toThrow();
  });
  it("does not launch from missing state, changed version or nonexistent units", async () => {
    const f = studentFixture(), source = reader(); source.state.mockRejectedValue(new V2RequestError(503)); const client = createV2MapClient(fixtureMapBase(), source);
    const route = { nodeId: f.card.id, entryId: f.card.id, unitStableKey: "unit-a" };
    const level = await client.level(route); const html = renderToString(<V2MapPanel meta={v2MapLevel(level)!} route={route} onClose={() => {}} />); expect(html).toContain("No pudimos cargar el estado confirmado"); expect(html).not.toContain("Continuar</button>");
    await expect(client.level({ ...route, unitStableKey: "unknown" })).rejects.toThrow("no existe");
    source.path.mockResolvedValue({ ...f.path, pathVersionId: f.path.pathId }); await expect(client.level(route)).rejects.toThrow("versión");
  });
});
