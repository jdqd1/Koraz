import { V2HttpContracts, V2EditorWorkspaceResponseSchema } from "@cediah/contracts";
import { forwardGuidedLearningRequest } from "@/lib/server/guided-learning-route";

export const dynamic = "force-dynamic";
export function GET(request: Request) {
  return forwardGuidedLearningRequest({ apiPath: "/v2/editor/learning-paths", method: "GET", request, responseSchema: V2EditorWorkspaceResponseSchema });
}
export function POST(request: Request) {
  return forwardGuidedLearningRequest({ apiPath: V2HttpContracts.editorCreate.path, method: "POST", request, responseSchema: V2HttpContracts.editorCreate.response });
}
