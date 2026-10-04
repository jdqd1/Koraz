"use client";

import { useState, useSyncExternalStore } from "react";
import { AppShell } from "@/components/app-shell";
import { LearningRouteEditor } from "../learning-route-editor-facade";
import { createEditorV2Api } from "./editor-api";
import { editorV2FixtureRoute, fixtureV2Id } from "./editor-fixtures";
import { V2BoundRouteDefinitionSchema } from "@cediah/contracts";

export function EditorV2FixtureWorkspace({ mode }: { mode: "ready" | "conflict" | "empty" | "published" | "network" }) {
  const storageKey = `t023:fixture-server:${mode}`;
  const [snapshotStore] = useState(() => {
    let snapshot: ReturnType<typeof editorV2FixtureRoute> | null = null;
    return { subscribe: () => () => {}, getServerSnapshot: () => null,
      getSnapshot() {
        if (!snapshot) {
          const stored = V2BoundRouteDefinitionSchema.safeParse(JSON.parse(sessionStorage.getItem(storageKey) ?? "null"));
          snapshot = stored.success ? stored.data : editorV2FixtureRoute();
          if (mode === "empty") snapshot.definition = { ...snapshot.definition, objectives: [], units: [], activities: [], assessments: [], reviewPlan: { objectiveKeys: [] } };
          if (mode === "published") snapshot.status = "published";
        }
        return snapshot;
      },
    };
  });
  const route = useSyncExternalStore(snapshotStore.subscribe, snapshotStore.getSnapshot, snapshotStore.getServerSnapshot);
  const [transport] = useState(() => createEditorV2Api(async (_url, init) => {
    const remote = V2BoundRouteDefinitionSchema.parse(JSON.parse(sessionStorage.getItem(storageKey) ?? JSON.stringify(editorV2FixtureRoute())));
    if (init?.method === "PATCH") {
      if (mode === "conflict") return Response.json({ error: "version_conflict" }, { status: 409 });
      if (mode === "network") throw new Error("Synthetic disconnection");
      const body = JSON.parse(String(init.body));
      if (body.expectedVersion !== remote.editVersion) return Response.json({ error: "version_conflict" }, { status: 409 });
      const confirmed = { ...remote, definition: body.package, bindings: body.bindings, editVersion: remote.editVersion + 1, reviewedContentHash: null, approvedBy: null };
      sessionStorage.setItem(storageKey, JSON.stringify(confirmed));
      return Response.json({ route: confirmed });
    }
    return Response.json({ route: remote });
  }));
  return <AppShell activeKey="learning" guidedLearningEnabled headerTitle="Editor de rutas">
    {route ? <LearningRouteEditor actorUserId={fixtureV2Id(1)} canPublish canReview initialPath={route} initialResources={[]} resourceNextCursor={null} resourceTopics={[]} routeTopics={[]} v2Transport={transport} replaceUrl={() => {}} /> : <p role="status">Cargando editor…</p>}
  </AppShell>;
}
