import { describe, expect, it } from "vitest";
import { RoutePackageSchema, validateRoutePackage, type RoutePackage } from "@cediah/contracts";
import { analyzeRouteGraph, availableObjectiveKeys } from "../src/guided-learning/v2/graph.js";

type ObjectiveInput = { key: string; unitKey: string; prerequisites?: string[]; required?: boolean };
type UnitInput = { key: string; objectiveKeys: string[]; activityKeys?: string[] };

function makePackage(objectives: ObjectiveInput[], units: UnitInput[], activities: RoutePackage["activities"] = []): RoutePackage {
  return RoutePackageSchema.parse({
    schemaVersion: "2.0", packageKey: "graph-fixture", revision: 1, locale: "es",
    route: { slug: "graph-fixture", title: "Ruta sintética", summary: "Prueba de grafo", topicLabel: "Tema", audience: "Alumno", discipline: "general", coverKey: "heart" },
    policyVersion: "guided-v2.0", sources: [], assets: [],
    objectives: objectives.map(({ key, unitKey, prerequisites = [], required = true }) => ({ key, title: key, unitKey, verb: "recall", criticality: required ? "core" : "detail", required, prerequisiteKeys: prerequisites, sourceKeys: [], comparisonGroup: null, misconceptions: [] })),
    units: units.map(({ key, objectiveKeys, activityKeys = [] }) => ({ key, title: key, objectiveKeys, activityKeys, support: "standard", estimatedMinutes: null })),
    activities, assessments: [], reviewPlan: { objectiveKeys: objectives.map((objective) => objective.key) },
    editorial: { notes: "", unresolvedIssues: [] },
  });
}

function study(key: string, objectiveKey: string): RoutePackage["activities"][number] {
  return {
    key, objectiveKey, relatedObjectiveKeys: [], phase: "learn", kind: "study", required: true,
    sourceKeys: [], representation: "text", equivalenceKey: key, hints: [], use: "learning",
    prompt: "Lee", payload: { body: "Texto", focusSpans: [], assetKey: null, scaffold: "explanation", videoRange: null },
    feedback: { explanation: "Revisar", commonError: "", sourceKeys: [] },
    misconceptionMappings: [], alternativeActivityKey: null,
  };
}

describe("guided v2 objective DAG", () => {
  it("P01 rejects A→B→C→A with a concrete cycle pointer and keeps draft data", () => {
    const pkg = makePackage([
      { key: "a", unitKey: "unit", prerequisites: ["c"] },
      { key: "b", unitKey: "unit", prerequisites: ["a"] },
      { key: "c", unitKey: "unit", prerequisites: ["b"] },
    ], [{ key: "unit", objectiveKeys: ["a", "b", "c"] }]);
    const before = JSON.stringify(pkg);
    const graph = analyzeRouteGraph(pkg);
    expect(graph.orderedObjectiveKeys).toEqual([]);
    expect(graph.cycle).toEqual(["a", "b", "c", "a"]);
    expect(graph.issues).toContainEqual(expect.objectContaining({ code: "DAG_CYCLE", path: "/objectives/0/prerequisiteKeys/0" }));
    expect(graph.issues.find((issue) => issue.code === "DAG_CYCLE")?.message).toContain("a → b → c → a");
    expect(validateRoutePackage(pkg)).toMatchObject({ valid: true, publishable: false });
    expect(JSON.stringify(pkg)).toBe(before);
  });

  it("P02 pinpoints self reference, missing reference and duplicate edge", () => {
    const pkg = makePackage([
      { key: "a", unitKey: "unit", prerequisites: ["a"] },
      { key: "b", unitKey: "unit", prerequisites: ["missing", "a", "a"] },
    ], [{ key: "unit", objectiveKeys: ["a", "b"] }]);
    const graph = analyzeRouteGraph(pkg);
    expect(graph.cycle).toEqual(["a", "a"]);
    expect(graph.issues).toContainEqual(expect.objectContaining({ code: "DAG_CYCLE", path: "/objectives/0/prerequisiteKeys/0" }));
    expect(graph.issues).toContainEqual(expect.objectContaining({ code: "REFERENCE_MISSING", path: "/objectives/1/prerequisiteKeys/0" }));
    expect(graph.issues).toContainEqual(expect.objectContaining({ code: "DUPLICATE_KEY", path: "/objectives/1/prerequisiteKeys/2" }));
  });

  it("P03 orders ties by unit and objective position while independent roots remain available", () => {
    const pkg = makePackage([
      { key: "e", unitKey: "second", prerequisites: ["d"] },
      { key: "d", unitKey: "second" },
      { key: "c", unitKey: "first", required: false },
      { key: "b", unitKey: "first", prerequisites: ["a"] },
      { key: "a", unitKey: "first" },
    ], [
      { key: "first", objectiveKeys: ["a", "b", "c"] },
      { key: "second", objectiveKeys: ["d", "e"] },
    ]);
    const graph = analyzeRouteGraph(pkg);
    expect(graph.issues).toEqual([]);
    expect(graph.orderedObjectiveKeys).toEqual(["a", "b", "c", "d", "e"]);
    expect(availableObjectiveKeys(pkg, new Set())).toEqual(["a", "c", "d"]);
    expect(availableObjectiveKeys(pkg, new Set(["a"]))).toEqual(["b", "c", "d"]);
  });

  it("rejects orphan, double membership and cross-unit activity without changing prerequisites", () => {
    const pkg = makePackage([
      { key: "a", unitKey: "first" },
      { key: "b", unitKey: "second" },
      { key: "orphan", unitKey: "first" },
    ], [
      { key: "first", objectiveKeys: ["a", "b"], activityKeys: ["study-b"] },
      { key: "second", objectiveKeys: ["b"], activityKeys: ["study-b"] },
    ], [study("study-b", "b")]);
    const issues = analyzeRouteGraph(pkg).issues;
    expect(issues).toContainEqual(expect.objectContaining({ code: "DUPLICATE_KEY", path: "/units/1/objectiveKeys/0" }));
    expect(issues).toContainEqual(expect.objectContaining({ code: "DUPLICATE_KEY", path: "/units/1/activityKeys/0" }));
    expect(issues).toContainEqual(expect.objectContaining({ code: "REFERENCE_MISSING", path: "/objectives/2/unitKey" }));
    expect(issues).toContainEqual(expect.objectContaining({ code: "REFERENCE_MISSING", path: "/activities/0/objectiveKey" }));
    expect(issues.every((issue) => issue.path.startsWith("/"))).toBe(true);
  });

  it("rejects duplicate collection keys and missing unit references", () => {
    const pkg = makePackage([
      { key: "a", unitKey: "unit" },
      { key: "a", unitKey: "unit" },
    ], [{ key: "unit", objectiveKeys: ["a", "missing"], activityKeys: ["missing-activity"] }], [study("orphan-activity", "a")]);
    const issues = analyzeRouteGraph(pkg).issues;
    expect(issues).toContainEqual(expect.objectContaining({ code: "DUPLICATE_KEY", path: "/objectives/1/key" }));
    expect(issues).toContainEqual(expect.objectContaining({ code: "REFERENCE_MISSING", path: "/units/0/objectiveKeys/1" }));
    expect(issues).toContainEqual(expect.objectContaining({ code: "REFERENCE_MISSING", path: "/units/0/activityKeys/0" }));
    expect(issues).toContainEqual(expect.objectContaining({ code: "REFERENCE_MISSING", path: "/activities/0/key" }));
  });

  it("accepts 200 objectives with stable order", () => {
    const objectives = Array.from({ length: 200 }, (_, i) => ({
      key: `objective-${String(i).padStart(3, "0")}`,
      unitKey: `unit-${Math.floor(i / 10)}`,
      prerequisites: i ? [`objective-${String(i - 1).padStart(3, "0")}`] : [],
    }));
    const units = Array.from({ length: 20 }, (_, i) => ({
      key: `unit-${i}`,
      objectiveKeys: objectives.slice(i * 10, (i + 1) * 10).map((objective) => objective.key),
    }));
    const graph = analyzeRouteGraph(makePackage(objectives, units));
    expect(graph.issues).toEqual([]);
    expect(graph.orderedObjectiveKeys).toEqual(objectives.map((objective) => objective.key));
  });
});
