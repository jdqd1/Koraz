import { V2HttpContracts } from "@cediah/contracts";
import { forwardGuidedLearningRequest } from "@/lib/server/guided-learning-route";

export const dynamic = "force-dynamic";
export function POST(request: Request) {
  return forwardGuidedLearningRequest({ apiPath: V2HttpContracts.editorCreate.path, method: "POST", request, responseSchema: V2HttpContracts.editorCreate.response });
}
