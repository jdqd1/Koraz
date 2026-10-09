import { V2HttpContracts } from "@cediah/contracts";
import type { EditorV2Draft } from "./editor-model";

export function editorV2CatalogAvailable(response: { status: number; body: unknown }) {
  return response.status === 200 && V2HttpContracts.editorSourceCatalog.response.safeParse(response.body).success;
}
export function newEditorV2Draft(identity: string): EditorV2Draft {
  return {
    package: { schemaVersion: "2.0", packageKey: `route-${identity}`, revision: 1, locale: "es",
      route: { title: "", slug: "", summary: "", topicLabel: "", audience: "Estudiantes", discipline: "general", coverKey: "heart" },
      policyVersion: "guided-v2.0", sources: [], assets: [], objectives: [], units: [], activities: [],
      assessments: [], reviewPlan: { objectiveKeys: [] }, editorial: { notes: "", unresolvedIssues: [] } },
    bindings: { topicContentId: "", sources: [], assets: [] },
  };
}
