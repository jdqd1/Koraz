import { NextResponse } from "next/server";
import { V2HttpContracts } from "@cediah/contracts";
import { forwardGuidedLearningRequest } from "@/lib/server/guided-learning-route";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = V2HttpContracts.editorMetrics.params.safeParse(await context.params);
  if (!params.success) return NextResponse.json({ error: "not_found" }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  return forwardGuidedLearningRequest({ request, method: "GET", apiPath: `/v2/editor/learning-paths/${params.data.id}/metrics${new URL(request.url).search}`,
    responseSchema: V2HttpContracts.editorMetrics.response });
}
