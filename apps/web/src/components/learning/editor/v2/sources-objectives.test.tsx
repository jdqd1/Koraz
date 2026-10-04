import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { analyzeRouteGraph, RoutePackageSchema } from "@cediah/contracts";
import { editorV2FixturePackage, editorV2FixtureRoute, fixtureV2Id } from "./editor-fixtures";
import { draftFromRouteV2 } from "./editor-model";
import { tryPrerequisiteV2, DependencyOrderV2 } from "./dependencies";
import { deleteObjectiveV2, moveObjectiveV2, objectiveDeletionBlockV2, ObjectivesV2 } from "./objectives";
import { bindCatalogSourceV2, sourceBindingIssuesV2, sourceDeletionBlockV2 } from "./sources";
import { FieldV2, normalizeFieldPathV2 } from "./sources-fields";
import { RouteBasicsV2 } from "./route-basics";

function graphFixture() {
  const pkg = editorV2FixturePackage();
  pkg.activities = []; pkg.assessments = []; pkg.units[0]!.activityKeys = [];
  pkg.objectives = ["a", "b", "c"].map((key) => ({ ...pkg.objectives[0]!, key, title: `Objetivo ${key}`, prerequisiteKeys: [] }));
  pkg.units[0]!.objectiveKeys = ["a", "b", "c"]; pkg.reviewPlan.objectiveKeys = ["a", "b", "c"];
  return pkg;
}
describe("T024 objective forms and shared DAG rules", () => {
  it("rejects a self-loop and a longer cycle before applying an edge, with names", () => {
    const pkg = graphFixture();
    expect(tryPrerequisiteV2(pkg, "a", "a")).toMatchObject({ ok: false });
    const first = tryPrerequisiteV2(pkg, "b", "a");
    if (!first.ok) throw new Error(first.message);
    const second = tryPrerequisiteV2(first.package, "c", "b");
    if (!second.ok) throw new Error(second.message);
    const cycle = tryPrerequisiteV2(second.package, "a", "c");
    expect(cycle).toMatchObject({ ok: false, message: expect.stringContaining("Objetivo a") });
    expect(second.package.objectives[0]!.prerequisiteKeys).toEqual([]);
    expect(analyzeRouteGraph(second.package).orderedObjectiveKeys).toEqual(["a", "b", "c"]);
    expect(pkg.objectives.every((item) => !item.prerequisiteKeys.length)).toBe(true);
  });
  it("rejects duplicate/missing prerequisites and keeps independent branches", () => {
    const pkg = graphFixture();
    expect(tryPrerequisiteV2(pkg, "a", "absent").ok).toBe(false);
    const result = tryPrerequisiteV2(pkg, "a", "c");
    if (!result.ok) throw new Error(result.message);
    expect(tryPrerequisiteV2(result.package, "a", "c").ok).toBe(false);
    expect(analyzeRouteGraph(result.package).orderedObjectiveKeys).toEqual(["b", "c", "a"]);
    const html = renderToStaticMarkup(<DependencyOrderV2 pkg={result.package} onLocate={() => {}} />);
    expect(html).toContain("Después de: Objetivo c"); expect(html).not.toContain("UUID");
  });
  it("moves an objective and all its primary activities together, preserving other units", () => {
    const pkg = editorV2FixturePackage();
    pkg.units.push({ key: "other", title: "Otra unidad", objectiveKeys: [], activityKeys: [], support: "standard", estimatedMinutes: null });
    const next = moveObjectiveV2(pkg, "objective", "other");
    expect(next.units[0]!.objectiveKeys).toEqual([]); expect(next.units[0]!.activityKeys).toEqual([]);
    expect(next.units[1]!.activityKeys).toEqual(pkg.activities.map((item) => item.key));
    expect(analyzeRouteGraph(next).issues).toEqual([]);
    expect(pkg.objectives[0]!.unitKey).toBe("unit");
  });
  it("blocks deletion of linked activities/evaluations and removes safe unit/review/edge references", () => {
    const full = editorV2FixturePackage();
    expect(objectiveDeletionBlockV2(full, "objective")).toContain("actividades");
    expect(deleteObjectiveV2(full, "objective")).toBe(full);
    full.activities = []; full.units[0]!.activityKeys = [];
    expect(objectiveDeletionBlockV2(full, "objective")).toContain("evaluaciones");
    const pkg = graphFixture(); pkg.objectives[1]!.prerequisiteKeys = ["a"];
    const deleted = deleteObjectiveV2(pkg, "a");
    expect(deleted.reviewPlan.objectiveKeys).toEqual(["b", "c"]);
    expect(deleted.objectives[0]!.prerequisiteKeys).toEqual([]);
    expect(deleted.units[0]!.objectiveKeys).toEqual(["b", "c"]);
    expect(analyzeRouteGraph(deleted).issues).toEqual([]);
  });
  it("renders named accessible controls, immutable CORE requirement and no UUID tasks", () => {
    const draft = draftFromRouteV2(editorV2FixtureRoute());
    const html = renderToStaticMarkup(<ObjectivesV2 draft={draft} disabled={false} onChange={() => {}} />);
    for (const label of ["Capacidad observable", "Criticidad", "Verbo", "Unidad", "Fuentes del objetivo", "Añadir prerrequisito", "Añadir enlace"]) expect(html).toContain(label);
    expect(html).toContain("CORE siempre es requerido"); expect(html).toContain("checked");
    expect(html).not.toContain(fixtureV2Id(1)); expect(html).not.toContain('type="hidden"');
    expect(RoutePackageSchema.safeParse({ ...draft.package, objectives: [{ ...draft.package.objectives[0]!, required: false }] }).success).toBe(false);
  });
});
describe("T024 sources and route basics", () => {
  it("pins only a real catalogue revision and resets fragment/verification on a document change", () => {
    const draft = draftFromRouteV2(editorV2FixtureRoute());
    const item = { sourceContentId: fixtureV2Id(200), title: "Otra guía", sourceVersion: 2, revision: { resourceRevisionId: fixtureV2Id(201), revisionNumber: 2, documentSha256: "b".repeat(64) } };
    const next = bindCatalogSourceV2(draft, "source", item)!;
    expect(next.bindings.sources).toEqual([{ key: "source", sourceContentId: item.sourceContentId, resourceRevisionId: item.revision.resourceRevisionId }]);
    expect(next.package.sources[0]!).toMatchObject({ documentSha256: item.revision.documentSha256, locator: { heading: "", sectionPath: [], page: null }, excerpt: "", verification: "provided", checkedAt: null });
    expect(bindCatalogSourceV2(draft, "source", { ...item, revision: null })).toBeNull();
    expect(bindCatalogSourceV2(draft, "missing", item)).toBeNull();
    expect(draft.package.sources[0]!.excerpt).toBe("Contenido de ejemplo");
    expect(bindCatalogSourceV2(draft, "source", { ...item, sourceContentId: draft.bindings.sources[0]!.sourceContentId!, revision: { ...item.revision, resourceRevisionId: draft.bindings.sources[0]!.resourceRevisionId! } })!.package.sources[0]!.excerpt).toBe("Contenido de ejemplo");
  });
  it("blocks deleting a source used in feedback, assets or objectives", () => {
    const pkg = editorV2FixturePackage(); expect(sourceDeletionBlockV2(pkg, "source")).not.toBeNull();
    pkg.activities = []; pkg.objectives = []; expect(sourceDeletionBlockV2(pkg, "source")).not.toBeNull();
    pkg.assets = []; expect(sourceDeletionBlockV2(pkg, "source")).toBeNull();
  });
  it("locates an unresolved guide and the missing verification/link of an external reference", () => {
    const draft = draftFromRouteV2(editorV2FixtureRoute());
    expect(sourceBindingIssuesV2(draft)).toEqual([]);
    draft.bindings.sources = [];
    expect(sourceBindingIssuesV2(draft)).toEqual([{ path: "package.sources.0.binding", message: "Selecciona una guía con revisión vigente." }]);
    draft.package.sources[0]!.kind = "reference";
    expect(sourceBindingIssuesV2(draft)[0]?.path).toBe("package.sources.0.url");
    draft.package.sources[0]!.url = "https://example.test/source";
    expect(sourceBindingIssuesV2(draft)[0]?.path).toBe("package.sources.0.verification");
    draft.package.sources[0]!.verification = "verified";
    expect(sourceBindingIssuesV2(draft)).toEqual([]);
  });
  it("normalizes JSON pointers and connects field errors to their input", () => {
    expect(normalizeFieldPathV2("/objectives/2/title")).toBe("package.objectives.2.title");
    expect(normalizeFieldPathV2("/bindings/topicContentId")).toBe("bindings.topicContentId");
    const html = renderToStaticMarkup(<FieldV2 label="Capacidad observable" path="package.objectives.2.title" issues={[{ path: "/objectives/2/title", message: "missing" }]}>{(input) => <input {...input} />}</FieldV2>);
    expect(html).toContain('aria-invalid="true"'); expect(html).toContain("aria-describedby"); expect(html).toContain("Revisa capacidad observable");
  });
  it("shows route metadata and source locator fields without requiring catalogue UUID input", () => {
    const html = renderToStaticMarkup(<RouteBasicsV2 draft={draftFromRouteV2(editorV2FixtureRoute())} disabled={false} onChange={() => {}} preserveSlug />);
    for (const label of ["Dirigida a", "Disciplina", "Portada", "Tema del catálogo", "Nombre de la fuente", "Cita bibliográfica", "Sección o encabezado", "Página", "Ruta de secciones", "Fragmento de la fuente", "Fecha de comprobación"]) expect(html).toContain(label);
    expect(html).not.toContain('placeholder="UUID'); expect(html).not.toContain('value="guided-v2.0"');
  });
});
