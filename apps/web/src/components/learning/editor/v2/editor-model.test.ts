import { describe, expect, it } from "vitest";
import { createEditorV2State, nextLocalKeyV2, reviewIsCurrentV2 } from "./editor-model";
import { editorV2Reducer } from "./editor-reducer";
import { serializeEditorV2 } from "./editor-serialization";
import { createEditorV2Recovery, editorV2RecoveryKey, parseEditorV2Recovery, recoveryMatchesV2 } from "./editor-recovery";
import { editorV2FixtureRoute, fixtureV2Id } from "./editor-fixtures";

describe("T023 v2 model, reducer and serialization", () => {
  it("preserves every kind, private authored payload and portable relationship", () => {
    const route = editorV2FixtureRoute();
    const state = createEditorV2State({ route });
    const result = serializeEditorV2(state);
    expect(result).toEqual({ ok: true, body: { package: route.definition, bindings: route.bindings, expectedVersion: 1 } });
    expect(state.draft.package.activities.map((a) => a.kind)).toHaveLength(8);
    state.draft.package.route.title = "Local";
    expect(route.definition.route.title).not.toBe("Local");
    expect(state.confirmed?.definition.route.title).not.toBe("Local");
  });
  it("serializes an allowlist and never sends identity, approval or runtime fields", () => {
    const state = createEditorV2State({ route: editorV2FixtureRoute() });
    const result = serializeEditorV2(state);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.body).sort()).toEqual(["bindings", "expectedVersion", "package"]);
    const draft = { ...state.draft, approvedBy: fixtureV2Id(9), status: "published", engineVersion: "guided-v2", contentHash: "a".repeat(64) };
    expect(serializeEditorV2({ ...state, draft })).toEqual(result);
    expect(serializeEditorV2({ ...state, confirmed: null })).toEqual({ ok: true, body: { package: state.draft.package, bindings: state.draft.bindings } });
  });
  it("marks the prior review stale after any content or binding change", () => {
    const initial = createEditorV2State({ route: editorV2FixtureRoute() });
    expect(reviewIsCurrentV2(initial)).toBe(true);
    const edited = editorV2Reducer(initial, { type: "edit", draft: { ...initial.draft, bindings: { ...initial.draft.bindings, topicContentId: fixtureV2Id(8) } } });
    expect(edited.localRevision).toBe(1);
    expect(reviewIsCurrentV2(edited)).toBe(false);
    expect(edited.confirmed).toEqual(initial.confirmed);
    expect(editorV2Reducer(initial, { type: "edit", draft: structuredClone(initial.draft) })).toBe(initial);
  });
  it("blocks editing during a mutation and of published content", () => {
    const state = createEditorV2State({ route: editorV2FixtureRoute() });
    const saving = editorV2Reducer(state, { type: "operation", operation: "saving" });
    const draft = { ...state.draft, package: { ...state.draft.package, route: { ...state.draft.package.route, title: "Otra" } } };
    expect(editorV2Reducer(saving, { type: "edit", draft })).toBe(saving);
    const published = { ...state, confirmed: { ...state.confirmed!, status: "published" as const } };
    expect(editorV2Reducer(published, { type: "edit", draft })).toBe(published);
  });
  it("uses stable local keys before persistence without fabricated catalogue UUIDs", () => {
    expect(nextLocalKeyV2("objective", ["objective-1", "objective-2"])).toBe("objective-3");
    expect(nextLocalKeyV2("", [])).toBe("item-1");
  });
  it("retains an unfinished text field locally but prevents sending it", () => {
    const state = createEditorV2State({ route: editorV2FixtureRoute() });
    state.draft.package.route.title = "";
    state.draft.package.objectives[0]!.title = "";
    const recovery = createEditorV2Recovery(state, fixtureV2Id(1), null, 100);
    expect(parseEditorV2Recovery(JSON.stringify(recovery), fixtureV2Id(1), state.confirmed!.pathId, 101)?.draft).toEqual(state.draft);
    expect(serializeEditorV2(state).ok).toBe(false);
  });
  it("isolates recovery by actor, path, version and engine, and rejects expiry/corruption", () => {
    const state = createEditorV2State({ route: editorV2FixtureRoute() });
    const recovery = createEditorV2Recovery(state, fixtureV2Id(1), null, 100);
    const raw = JSON.stringify(recovery);
    expect(parseEditorV2Recovery(raw, fixtureV2Id(1), state.confirmed!.pathId, 101)).toEqual(recovery);
    expect(parseEditorV2Recovery(raw, fixtureV2Id(9), state.confirmed!.pathId, 101)).toBeNull();
    expect(parseEditorV2Recovery(raw, fixtureV2Id(1), fixtureV2Id(9), 101)).toBeNull();
    expect(parseEditorV2Recovery(raw, fixtureV2Id(1), state.confirmed!.pathId, 86_400_100)).toBeNull();
    expect(parseEditorV2Recovery("broken", fixtureV2Id(1), null)).toBeNull();
    expect(parseEditorV2Recovery(JSON.stringify({ ...recovery, engineVersion: "guided-v1" }), fixtureV2Id(1), state.confirmed!.pathId, 101)).toBeNull();
    expect(recoveryMatchesV2(recovery, { ...state, confirmed: { ...state.confirmed!, editVersion: 2 } })).toBe(false);
    expect(editorV2RecoveryKey(fixtureV2Id(1), state.confirmed!.pathId)).toContain(":v2:");
    expect(parseEditorV2Recovery(JSON.stringify({ ...recovery, draft: { ...recovery.draft, status: "published" } }), fixtureV2Id(1), state.confirmed!.pathId, 101)).toBeNull();
  });
});
