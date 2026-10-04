import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RoutePackageSchema, V2HttpContracts } from "@cediah/contracts";
import { createEditorV2Api } from "./editor-api";
import { createEditorV2State, draftFromRouteV2 } from "./editor-model";
import { createEditorV2Controller } from "./editor-controller";
import { editorV2FixtureRoute, fixtureV2Id } from "./editor-fixtures";
import { addAssessmentV2, assessmentCandidatesV2, AssessmentEditorV2 } from "./assessment-editor";
import { parseImportFileV2, importLimitV2, importIssueFieldV2 } from "./import-wizard";
import { ReviewAssetsV2 } from "./review-assets";
import { reviewActionsV2, reviewFailureNoticeV2, ReviewWorkflowV2 } from "./review-workflow";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ session: vi.fn(), request: vi.fn() }));
vi.mock("@/lib/server/api-session", () => ({ getApiRequestCookie: mocks.session }));
vi.mock("@/lib/server/content-api", () => ({ requestContentApi: mocks.request, getContentApiError: () => "unavailable" }));
import { GET, POST } from "@/app/api/v2/editor/learning-paths/[...path]/route";

describe("T027 portable import and assessment setup", () => {
  it("links source, asset and topic incidences to their exact binding controls", () => {
    expect(importIssueFieldV2("/sources/2/documentSha256")).toBe("package.sources.2.binding");
    expect(importIssueFieldV2("/assets/1/sha256")).toBe("bindings.assets.1.assetId");
    expect(importIssueFieldV2("/bindings/topicContentId")).toBe("bindings.topicContentId");
    expect(importIssueFieldV2("/assessments/0")).toBe("import.file");
  });
  it("offers recoverable asset bindings and editorial metadata at exact field paths", () => {
    const draft = draftFromRouteV2(editorV2FixtureRoute());
    const html = renderToStaticMarkup(<ReviewAssetsV2 draft={draft} disabled={false} onChange={() => {}} />);
    expect(html).toContain('data-field-path="package.assets.0"');
    expect(html).toContain('data-field-path="package.assets.0.rightsStatus"');
    expect(html).toContain('data-field-path="package.assets.0.sha256"');
    expect(html).toContain("Vínculo guardado");
  });
  it("reads portable JSON or an editorial export without copying approval/progress", () => {
    const route = editorV2FixtureRoute();
    expect(parseImportFileV2(JSON.stringify(route.definition)).bindings).toEqual({ topicContentId: "", sources: [], assets: [] });
    expect(parseImportFileV2(JSON.stringify({ package: route.definition, bindings: route.bindings }))).toEqual(draftFromRouteV2(route));
    expect(() => parseImportFileV2(JSON.stringify({ ...route.definition, approvedBy: fixtureV2Id(1) }))).toThrow();
    expect(() => parseImportFileV2(JSON.stringify(route))).toThrow();
    expect(() => parseImportFileV2('{"schemaVersion":"9.0"}')).toThrow();
    expect(() => parseImportFileV2("{" )).toThrow();
    expect(() => parseImportFileV2(" ".repeat(importLimitV2 + 1))).toThrow("10 MiB");
  });
  it("counts multibyte content against the byte limit", () => { expect(() => parseImportFileV2("é".repeat(importLimitV2 / 2 + 1))).toThrow("10 MiB"); });
  it("does not fabricate a bank or a threshold justification", () => {
    const pkg = editorV2FixtureRoute().definition;
    const next = addAssessmentV2(pkg, "retention7");
    expect(next.assessments.at(-1)).toMatchObject({ kind: "retention7", thresholdPercent: 80, thresholdRationale: "", candidateActivityKeys: [] });
    expect(next.activities).toBe(pkg.activities);
    expect(addAssessmentV2(next, "retention7").assessments.at(-1)?.key).not.toBe(next.assessments.at(-1)?.key);
  });
  it("filters reserves, objectives and case children without changing the package", () => {
    const pkg = editorV2FixtureRoute().definition;
    const item = { ...pkg.assessments[0]!, objectiveKeys: ["objective"] };
    expect(assessmentCandidatesV2(pkg, item)).toEqual([]);
    const final = { ...pkg.activities[1]!, key: "reserved", use: "final" as const };
    pkg.activities.push(final);
    expect(assessmentCandidatesV2(pkg, item).map((activity) => activity.key)).toEqual(["reserved"]);
    expect(assessmentCandidatesV2(pkg, { ...item, kind: "unit_gate" }).map((activity) => activity.key)).not.toContain("choice");
    pkg.assessments.push({ ...item, key: "other", candidateActivityKeys: ["reserved"] });
    expect(assessmentCandidatesV2(pkg, item)).toEqual([]);
    expect(assessmentCandidatesV2(pkg, { ...item, objectiveKeys: [] })).toEqual([]);
  });
  it("round-trips assessment configuration and review plan", () => {
    const pkg = editorV2FixtureRoute().definition;
    pkg.assessments[0]!.thresholdPercent = 95;
    pkg.assessments[0]!.thresholdRationale = "Un criterio editorial explícito para esta prueba de software.";
    expect(RoutePackageSchema.parse(JSON.parse(JSON.stringify(pkg)))).toEqual(pkg);
    const html = renderToStaticMarkup(<AssessmentEditorV2 draft={{ package: pkg, bindings: editorV2FixtureRoute().bindings }} disabled={false} onChange={() => {}} />);
    expect(html).toContain("falta banco de preguntas"); expect(html).toContain("Justificación del umbral"); expect(html).toContain("package.assessments.0.thresholdRationale");
  });
});
describe("T027 roles, confirmed state and recovery", () => {
  it.each(["draft", "changes_requested", "in_review", "approved", "published"] as const)("limits creator actions in %s", (status) => {
    const route = editorV2FixtureRoute(); route.status = status;
    expect(reviewActionsV2(createEditorV2State({ route }), { canReview: false, canPublish: false })).toEqual(["draft", "changes_requested"].includes(status) ? ["in_review"] : []);
  });
  it("exposes approve and publish only at the corresponding status and capability", () => {
    const route = editorV2FixtureRoute(); route.status = "in_review";
    expect(reviewActionsV2(createEditorV2State({ route }), { canReview: true, canPublish: true })).toEqual(["changes_requested", "approved"]);
    route.status = "approved";
    expect(reviewActionsV2(createEditorV2State({ route }), { canReview: true, canPublish: true })).toEqual(["published"]);
  });
  it("never gives creators an authorized publish button; blocks stale approval", () => {
    const route = editorV2FixtureRoute(); route.status = "approved"; route.reviewedContentHash = null;
    const state = createEditorV2State({ route }); const controller = createEditorV2Controller({ state, actorUserId: fixtureV2Id(1) });
    const creator = renderToStaticMarkup(<ReviewWorkflowV2 state={state} controller={controller} onLocate={() => {}} />);
    expect(creator).not.toContain("Publicar ruta");
    const reviewer = renderToStaticMarkup(<ReviewWorkflowV2 state={state} controller={controller} canReview canPublish onLocate={() => {}} />);
    expect(reviewer).toMatch(/disabled=""[^>]*>Publicar ruta/);
  });
  it("cannot replace unsaved local edits with a workflow confirmation", () => {
    const route = editorV2FixtureRoute(); const controller = createEditorV2Controller({ state: createEditorV2State({ route }), actorUserId: fixtureV2Id(1) });
    controller.edit({ ...draftFromRouteV2(route), package: { ...route.definition, route: { ...route.definition.route, title: "Local" } } });
    expect(controller.confirmWorkflow({ ...route, editVersion: 2, status: "in_review" })).toBe(false);
    expect(controller.getSnapshot().draft.package.route.title).toBe("Local");
    expect(controller.getSnapshot().dirty).toBe(true);
  });
  it("accepts a confirmed new draft version even when its edit counter restarts", () => {
    const route = editorV2FixtureRoute(); route.editVersion = 8; route.status = "published";
    const controller = createEditorV2Controller({ state: createEditorV2State({ route }), actorUserId: fixtureV2Id(1) });
    expect(controller.confirmWorkflow({ ...route, pathVersionId: fixtureV2Id(99) as typeof route.pathVersionId, editVersion: 1, status: "draft" })).toBe(true);
  });
  it("describes source/revision recovery and keeps server incidence details", async () => {
    expect(reviewFailureNoticeV2("SOURCE_CHANGED", 409)).toContain("vuelve a validar");
    expect(reviewFailureNoticeV2("VERSION_CONFLICT", 409)).toContain("copia local");
    const issue = { code: "SOURCE_CHANGED", severity: "error", path: "/sources/0", message: "Cambió", suggestedFix: "Vincula" };
    const api = createEditorV2Api(async () => Response.json({ error: "route_not_ready", issues: [issue] }, { status: 422 }));
    expect(await api.transition(fixtureV2Id(2), { expectedVersion: 1, status: "in_review", reviewNote: "" }, fixtureV2Id(8))).toMatchObject({ ok: false, status: 422, issues: [issue] });
  });
  it("sends one explicit idempotency key and expected version in workflow requests", async () => {
    const route = editorV2FixtureRoute(); const fetcher = vi.fn(async () => Response.json({ route }));
    const api = createEditorV2Api(fetcher); const body = { expectedVersion: 1, status: "in_review" as const, reviewNote: "Revisión" }; const key = fixtureV2Id(100);
    await api.transition(route.pathId, body, key); await api.transition(route.pathId, body, key);
    expect(fetcher.mock.calls[0]).toEqual(fetcher.mock.calls[1]);
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining("/transition"), expect.objectContaining({ body: JSON.stringify(body), headers: { "Content-Type": "application/json", "Idempotency-Key": key }, cache: "no-store" }));
  });
});
describe("T027 BFF workflow routes", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.session.mockResolvedValue({ status: "ready", cookie: "synthetic=session" }); });
  it.each(["importValidate", "importCommit", "editorValidate", "editorTransition", "editorVersion", "editorExport"] as const)("forwards %s privately using its response contract", async (name) => {
    const contract = V2HttpContracts[name]; const id = fixtureV2Id(2);
    const path = contract.path.split("/").slice(4).map((part) => part === ":id" ? id : part);
    const route = editorV2FixtureRoute();
    const value = name === "importValidate" ? { importId: id, hash: "a".repeat(64), expiresAt: "2026-10-03T00:00:00Z", readyToImport: true, issues: [], diff: [] }
      : name === "editorExport" ? { package: route.definition, bindings: route.bindings }
      : name === "editorValidate" ? { issues: [], validatedEditVersion: 1, ready: false }
      : name === "editorTransition" ? { route } : { pathId: id, pathVersionId: fixtureV2Id(4), editVersion: 1, status: "draft" };
    mocks.request.mockResolvedValue({ status: 200, body: value });
    const request = new Request(`http://localhost/api/v2/editor/learning-paths/${path.join("/")}`, { method: contract.method, headers: { origin: "http://localhost", "Idempotency-Key": fixtureV2Id(100) }, ...(contract.method === "GET" ? {} : { body: "{}" }) });
    const response = await (contract.method === "GET" ? GET : POST)(request, { params: Promise.resolve({ path }) });
    expect(response.status).toBe(200); expect(response.headers.get("Cache-Control")).toBe("private, no-store"); expect(await response.json()).toEqual(value);
    expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({ path: `/v2/editor/learning-paths/${path.join("/")}`, method: contract.method, cookie: "synthetic=session" }));
  });
  it("rejects cross-origin writes and unsupported routes", async () => {
    expect((await POST(new Request("http://localhost/api/v2/editor/learning-paths/imports/validate", { method: "POST", headers: { origin: "https://external.example" }, body: "{}" }), { params: Promise.resolve({ path: ["imports", "validate"] }) })).status).toBe(403);
    expect(mocks.request).not.toHaveBeenCalled();
    expect((await GET(new Request("http://localhost/"), { params: Promise.resolve({ path: [fixtureV2Id(2), "publish"] }) })).status).toBe(404);
  });
});
