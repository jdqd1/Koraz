import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { V2HttpContracts, type ContentProvider, type IdentityProvider } from "@cediah/contracts";
import { getContentCapabilities } from "../../content-authorization.js";
import { resolveGuidedUser, sendGuidedUserError } from "../http.js";
import type { createPostgresGuidedLearningV2Provider } from "../../providers/postgres-guided-learning-v2.js";
import { MAX_ROUTE_IMPORT_BYTES, parseRouteImport } from "./import.js";

type ImportProvider = Pick<ReturnType<typeof createPostgresGuidedLearningV2Provider>,
  "validateImport" | "commitImport" | "exportPath" | "validatePath" | "transitionPath" | "createVersion"> & Partial<Pick<ReturnType<typeof createPostgresGuidedLearningV2Provider>, "createDraft" | "getEditorPath" | "saveDraft" | "previewPath" | "convertV1" | "listEditorSourceCatalog">>;
export type GuidedV2EditorProvider = ImportProvider;

/** Exported separately so the v2 registration can be connected without changing v1 routes. */
export async function registerGuidedV2EditorImportRoutes(app: FastifyInstance, dependencies: {
  contentProvider?: ContentProvider;
  identityProvider?: IdentityProvider;
  provider?: ImportProvider;
}) {
  app.addHook("onError", async (request, reply, error) => {
    if (!request.url.startsWith("/v2/editor/learning-paths")) return;
    reply.header("Cache-Control", "private, no-store");
    if (error.message === "Origin not allowed") error.statusCode = 403;
  });
  app.get(V2HttpContracts.editorSourceCatalog.path, async (request, reply) => {
    reply.header("Cache-Control", "private, no-store");
    const actor = await resolveGuidedUser(request, dependencies.identityProvider);
    if (actor.kind !== "authenticated") return sendGuidedUserError(actor, reply);
    if (!dependencies.contentProvider || !dependencies.provider?.listEditorSourceCatalog) return reply.status(503).send({ error: "learning_unavailable" });
    try {
      const capabilities = getContentCapabilities(await dependencies.contentProvider.getRoles(actor.user.id));
      if (!capabilities.canCreate && !capabilities.canEditAll) return reply.status(403).send({ error: "forbidden" });
      const query = V2HttpContracts.editorSourceCatalog.query.safeParse(request.query);
      if (!query.success) return reply.status(400).send({ error: "invalid_request" });
      const value = await dependencies.provider.listEditorSourceCatalog({ ...query.data, actorUserId: actor.user.id, canEditAll: capabilities.canEditAll });
      return reply.send(V2HttpContracts.editorSourceCatalog.response.parse(value));
    } catch {
      request.log.error("Guided v2 source catalog request failed");
      return reply.status(503).send({ error: "learning_unavailable" });
    }
  });
  for (const name of ["editorCreate", "editorGet", "editorPatch", "editorPreview", "convertV1"] as const) {
    const endpoint = V2HttpContracts[name];
    app.route({ method: endpoint.method, url: endpoint.path, bodyLimit: MAX_ROUTE_IMPORT_BYTES + 64 * 1024, handler: async (request, reply) => {
      reply.header("Cache-Control", "private, no-store");
      const actor = await resolveGuidedUser(request, dependencies.identityProvider);
      if (actor.kind !== "authenticated") return sendGuidedUserError(actor, reply);
      if (!dependencies.contentProvider || !dependencies.provider) return reply.status(503).send({ error: "learning_unavailable" });
      try {
        const capabilities = getContentCapabilities(await dependencies.contentProvider.getRoles(actor.user.id));
        if (!capabilities.canCreate && !capabilities.canEditAll) return reply.status(403).send({ error: "forbidden" });
        const params = endpoint.params.safeParse(request.params);
        const body = endpoint.body.safeParse(request.body ?? {});
        const key = endpoint.method === "GET" ? null : z.string().uuid().safeParse(request.headers["idempotency-key"]);
        if (!params.success || !body.success || (key && !key.success)) return reply.status(400).send({ error: "invalid_request" });
        if ("package" in body.data) {
          const parsed = parseRouteImport(body.data.package);
          if (parsed.status !== "success") return reply.status(parsed.status === "too_large" ? 413 : 400).send({ error: "invalid_request" });
        }
        const provider = dependencies.provider;
        const id = "id" in params.data ? params.data.id : "";
        const common = { actorUserId: actor.user.id, canEdit: true, canEditAll: capabilities.canEditAll, pathId: id, idempotencyKey: key?.success ? key.data : "" };
        let result;
        if (name === "editorCreate" && "package" in body.data && provider.createDraft) result = await provider.createDraft({ ...common, canCreate: capabilities.canCreate, package: body.data.package, bindings: body.data.bindings, enforceAccess: true });
        else if (name === "editorGet" && provider.getEditorPath) result = await provider.getEditorPath({ ...common, enforceAccess: true });
        else if (name === "editorPatch" && "expectedVersion" in body.data && "package" in body.data && provider.saveDraft) result = await provider.saveDraft({ ...common, expectedVersion: body.data.expectedVersion, package: body.data.package, bindings: body.data.bindings, enforceAccess: true });
        else if (name === "editorPreview" && "package" in body.data && provider.previewPath) result = await provider.previewPath({ ...common, package: body.data.package, bindings: body.data.bindings });
        else if (name === "convertV1" && "expectedVersion" in body.data && provider.convertV1) result = await provider.convertV1({ ...common, expectedVersion: body.data.expectedVersion });
        else return reply.status(503).send({ error: "learning_unavailable" });
        if (result.status !== "success") {
          const status = result.status === "forbidden" ? 403 : result.status === "not_found" ? 404 : result.status === "invalid" ? 422 : result.status === "rate_limited" ? 429 : 409;
          return reply.status(status).send({ error: result.status === "invalid" ? "resource_unavailable" : result.status });
        }
        let value: unknown = result.value;
        if (name === "editorCreate") {
          const route = result.value as { pathId: string; pathVersionId: string; editVersion: number };
          value = { pathId: route.pathId, pathVersionId: route.pathVersionId, editVersion: route.editVersion, status: "draft" };
        } else if (name === "editorGet" || name === "editorPatch") value = { route: result.value };
        else if (name === "editorPreview") {
          const preview = result.value as Record<string, unknown>;
          value = { previewId: preview.previewId, activeActivity: preview.activeActivity, issues: preview.issues, expiresAt: preview.expiresAt };
        }
        const response = endpoint.response.safeParse(value);
        if (!response.success) return reply.status(503).send({ error: "learning_unavailable" });
        return reply.send(response.data);
      } catch {
        request.log.error("Guided v2 editorial request failed");
        return reply.status(503).send({ error: "learning_unavailable" });
      }
    } });
  }

  app.post<{ Body: unknown }>(V2HttpContracts.importValidate.path, { bodyLimit: 10 * 1024 * 1024 + 64 * 1024 }, async (request, reply) => {
    reply.header("Cache-Control", "private, no-store");
    const user = await resolveGuidedUser(request, dependencies.identityProvider);
    if (user.kind !== "authenticated") return sendGuidedUserError(user, reply);
    if (!dependencies.contentProvider || !dependencies.provider) return reply.status(503).send({ error: "learning_unavailable" });
    let roles: Awaited<ReturnType<ContentProvider["getRoles"]>>;
    try { roles = await dependencies.contentProvider.getRoles(user.user.id); }
    catch { return reply.status(503).send({ error: "learning_unavailable" }); }
    const capabilities = getContentCapabilities(roles);
    if (!capabilities.canCreate) return reply.status(403).send({ error: "forbidden" });
    const key = z.string().uuid().safeParse(request.headers["idempotency-key"]);
    if (!key.success) return reply.status(400).send({ error: "invalid_idempotency_key" });
    try {
      const packageBytes = Buffer.byteLength(JSON.stringify((request.body as { package?: unknown })?.package), "utf8");
      if (packageBytes > MAX_ROUTE_IMPORT_BYTES) return reply.status(413).send({ error: "import_too_large" });
    } catch { return reply.status(400).send({ error: "invalid_request" }); }
    const body = V2HttpContracts.importValidate.body.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: "invalid_request", fieldErrors: body.error.issues.map((issue) => ({ path: issue.path.join("."), code: issue.code })) });
    let result: Awaited<ReturnType<ImportProvider["validateImport"]>>;
    try {
      result = await dependencies.provider.validateImport({
        actorUserId: user.user.id, canCreate: capabilities.canCreate, canEditAll: capabilities.canEditAll,
        idempotencyKey: key.data, package: body.data.package, bindings: body.data.bindings,
        targetPathId: body.data.targetPathId, expectedVersion: body.data.expectedVersion,
      });
    } catch {
      request.log.error("Guided v2 import validation failed");
      return reply.status(503).send({ error: "learning_unavailable" });
    }
    if (result.status === "too_large") return reply.status(413).send({ error: "import_too_large" });
    if (result.status === "rate_limited") return reply.status(429).send({ error: "rate_limited" });
    if (result.status === "forbidden") return reply.status(403).send({ error: "forbidden" });
    if (result.status === "not_found") return reply.status(404).send({ error: "not_found" });
    if (result.status === "version_conflict" || result.status === "conflict") return reply.status(409).send({ error: result.status });
    if (result.status === "invalid") return reply.status(400).send({ error: "invalid_request", issues: result.issues });
    if (result.status !== "success") return reply.status(503).send({ error: "learning_unavailable" });
    const response = V2HttpContracts.importValidate.response.safeParse(result.value);
    if (!response.success) return reply.status(503).send({ error: "learning_unavailable" });
    return reply.send(response.data);
  });

  app.post<{ Body: unknown; Params: { id: string } }>(V2HttpContracts.importCommit.path, async (request, reply) => {
    reply.header("Cache-Control", "private, no-store");
    const user = await resolveGuidedUser(request, dependencies.identityProvider);
    if (user.kind !== "authenticated") return sendGuidedUserError(user, reply);
    if (!dependencies.contentProvider || !dependencies.provider) return reply.status(503).send({ error: "learning_unavailable" });
    let roles: Awaited<ReturnType<ContentProvider["getRoles"]>>;
    try { roles = await dependencies.contentProvider.getRoles(user.user.id); }
    catch { return reply.status(503).send({ error: "learning_unavailable" }); }
    const capabilities = getContentCapabilities(roles);
    if (!capabilities.canCreate) return reply.status(403).send({ error: "forbidden" });
    const key = z.string().uuid().safeParse(request.headers["idempotency-key"]);
    const params = V2HttpContracts.importCommit.params.safeParse(request.params);
    const body = V2HttpContracts.importCommit.body.safeParse(request.body);
    if (!key.success || !params.success || !body.success) return reply.status(400).send({ error: "invalid_request" });
    let result: Awaited<ReturnType<ImportProvider["commitImport"]>>;
    try {
      result = await dependencies.provider.commitImport({
        actorUserId: user.user.id, canCreate: capabilities.canCreate, canEditAll: capabilities.canEditAll,
        importId: params.data.id, idempotencyKey: key.data, hash: body.data.hash,
        expectedVersion: body.data.expectedVersion,
      });
    } catch {
      request.log.error("Guided v2 import commit failed");
      return reply.status(503).send({ error: "learning_unavailable" });
    }
    if (result.status === "forbidden") return reply.status(403).send({ error: "forbidden" });
    if (result.status === "not_found") return reply.status(404).send({ error: "not_found" });
    if (result.status === "version_conflict" || result.status === "conflict") return reply.status(409).send({ error: result.status });
    if (result.status === "invalid") return reply.status(422).send({ error: "route_not_ready", issues: result.issues });
    if (result.status !== "success") return reply.status(503).send({ error: "learning_unavailable" });
    const response = V2HttpContracts.importCommit.response.safeParse(result.value);
    if (!response.success) return reply.status(503).send({ error: "learning_unavailable" });
    return reply.send(response.data);
  });

  app.get<{ Params: { id: string } }>(V2HttpContracts.editorExport.path, async (request, reply) => {
    reply.header("Cache-Control", "private, no-store");
    const user = await resolveGuidedUser(request, dependencies.identityProvider);
    if (user.kind !== "authenticated") return sendGuidedUserError(user, reply);
    if (!dependencies.contentProvider || !dependencies.provider) return reply.status(503).send({ error: "learning_unavailable" });
    let roles: Awaited<ReturnType<ContentProvider["getRoles"]>>;
    try { roles = await dependencies.contentProvider.getRoles(user.user.id); }
    catch { return reply.status(503).send({ error: "learning_unavailable" }); }
    const capabilities = getContentCapabilities(roles);
    if (!capabilities.canCreate) return reply.status(403).send({ error: "forbidden" });
    const params = V2HttpContracts.editorExport.params.safeParse(request.params);
    if (!params.success) return reply.status(404).send({ error: "not_found" });
    let result: Awaited<ReturnType<ImportProvider["exportPath"]>>;
    try {
      result = await dependencies.provider.exportPath({ actorUserId: user.user.id, canEdit: true, canEditAll: capabilities.canEditAll, pathId: params.data.id });
    } catch {
      request.log.error("Guided v2 route export failed");
      return reply.status(503).send({ error: "learning_unavailable" });
    }
    if (result.status === "forbidden") return reply.status(403).send({ error: "forbidden" });
    if (result.status === "not_found") return reply.status(404).send({ error: "not_found" });
    if (result.status !== "success") return reply.status(409).send({ error: result.status });
    const response = V2HttpContracts.editorExport.response.safeParse(result.value);
    if (!response.success) return reply.status(503).send({ error: "learning_unavailable" });
    return reply.send(response.data);
  });

  app.post<{ Body: unknown; Params: { id: string } }>(V2HttpContracts.editorValidate.path, async (request, reply) => {
    reply.header("Cache-Control", "private, no-store");
    const user = await resolveGuidedUser(request, dependencies.identityProvider);
    if (user.kind !== "authenticated") return sendGuidedUserError(user, reply);
    if (!dependencies.contentProvider || !dependencies.provider) return reply.status(503).send({ error: "learning_unavailable" });
    let roles: Awaited<ReturnType<ContentProvider["getRoles"]>>;
    try { roles = await dependencies.contentProvider.getRoles(user.user.id); }
    catch { return reply.status(503).send({ error: "learning_unavailable" }); }
    const capabilities = getContentCapabilities(roles);
    if (!capabilities.canCreate && !capabilities.canEditAll) return reply.status(403).send({ error: "forbidden" });
    const key = z.string().uuid().safeParse(request.headers["idempotency-key"]);
    const params = V2HttpContracts.editorValidate.params.safeParse(request.params);
    const body = V2HttpContracts.editorValidate.body.safeParse(request.body);
    if (!key.success || !params.success || !body.success) return reply.status(400).send({ error: "invalid_request" });
    try {
      const result = await dependencies.provider.validatePath({
        actorUserId: user.user.id, canEdit: true, canEditAll: capabilities.canEditAll,
        canPublish: capabilities.canPublish, pathId: params.data.id, expectedVersion: body.data.expectedVersion,
      });
      if (result.status === "forbidden") return reply.status(403).send({ error: "forbidden" });
      if (result.status === "not_found") return reply.status(404).send({ error: "not_found" });
      if (result.status !== "success") return reply.status(409).send({ error: result.status });
      return reply.header("Cache-Control", "private, no-store")
        .send(V2HttpContracts.editorValidate.response.parse(result.value));
    } catch {
      request.log.error("Guided v2 validation failed");
      return reply.status(503).send({ error: "learning_unavailable" });
    }
  });

  app.post<{ Body: unknown; Params: { id: string } }>(V2HttpContracts.editorTransition.path, async (request, reply) => {
    reply.header("Cache-Control", "private, no-store");
    const user = await resolveGuidedUser(request, dependencies.identityProvider);
    if (user.kind !== "authenticated") return sendGuidedUserError(user, reply);
    if (!dependencies.contentProvider || !dependencies.provider) return reply.status(503).send({ error: "learning_unavailable" });
    let roles: Awaited<ReturnType<ContentProvider["getRoles"]>>;
    try { roles = await dependencies.contentProvider.getRoles(user.user.id); }
    catch { return reply.status(503).send({ error: "learning_unavailable" }); }
    const capabilities = getContentCapabilities(roles);
    if (!capabilities.canCreate && !capabilities.canEditAll) return reply.status(403).send({ error: "forbidden" });
    const key = z.string().uuid().safeParse(request.headers["idempotency-key"]);
    const params = V2HttpContracts.editorTransition.params.safeParse(request.params);
    const body = V2HttpContracts.editorTransition.body.safeParse(request.body);
    if (!key.success || !params.success || !body.success) return reply.status(400).send({ error: "invalid_request" });
    if (body.data.status === "draft") return reply.status(409).send({ error: "conflict" });
    try {
      const result = await dependencies.provider.transitionPath({
        actorUserId: user.user.id, canEdit: true, canEditAll: capabilities.canEditAll,
        canReview: capabilities.canReview, canPublish: capabilities.canPublish,
        pathId: params.data.id, expectedVersion: body.data.expectedVersion,
        status: body.data.status, reviewNote: body.data.reviewNote,
      });
      if (result.status === "forbidden") return reply.status(403).send({ error: "forbidden" });
      if (result.status === "not_found") return reply.status(404).send({ error: "not_found" });
      if (result.status === "invalid") return reply.status(422).send({ error: "route_not_ready", issues: result.issues });
      if (result.status !== "success") return reply.status(409).send({ error: result.status });
      return reply.header("Cache-Control", "private, no-store")
        .send(V2HttpContracts.editorTransition.response.parse({ route: result.value }));
    } catch {
      request.log.error("Guided v2 transition failed");
      return reply.status(503).send({ error: "learning_unavailable" });
    }
  });

  app.post<{ Body: unknown; Params: { id: string } }>(V2HttpContracts.editorVersion.path, async (request, reply) => {
    reply.header("Cache-Control", "private, no-store");
    const user = await resolveGuidedUser(request, dependencies.identityProvider);
    if (user.kind !== "authenticated") return sendGuidedUserError(user, reply);
    if (!dependencies.contentProvider || !dependencies.provider) return reply.status(503).send({ error: "learning_unavailable" });
    let roles: Awaited<ReturnType<ContentProvider["getRoles"]>>;
    try { roles = await dependencies.contentProvider.getRoles(user.user.id); }
    catch { return reply.status(503).send({ error: "learning_unavailable" }); }
    const capabilities = getContentCapabilities(roles);
    if (!capabilities.canCreate && !capabilities.canEditAll) return reply.status(403).send({ error: "forbidden" });
    const key = z.string().uuid().safeParse(request.headers["idempotency-key"]);
    const params = V2HttpContracts.editorVersion.params.safeParse(request.params);
    const body = V2HttpContracts.editorVersion.body.safeParse(request.body);
    if (!key.success || !params.success || !body.success) return reply.status(400).send({ error: "invalid_request" });
    try {
      const result = await dependencies.provider.createVersion({
        actorUserId: user.user.id, canEdit: true, canEditAll: capabilities.canEditAll,
        pathId: params.data.id, expectedVersion: body.data.expectedVersion, releaseNotes: body.data.releaseNotes,
      });
      if (result.status === "forbidden") return reply.status(403).send({ error: "forbidden" });
      if (result.status === "not_found") return reply.status(404).send({ error: "not_found" });
      if (result.status !== "success") return reply.status(409).send({ error: result.status });
      return reply.status(201).header("Cache-Control", "private, no-store")
        .send(V2HttpContracts.editorVersion.response.parse(result.value));
    } catch {
      request.log.error("Guided v2 version creation failed");
      return reply.status(503).send({ error: "learning_unavailable" });
    }
  });
}
