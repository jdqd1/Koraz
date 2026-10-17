import { z } from "zod";
import { V2EditorSourceSectionsSchema } from "@cediah/contracts";
import { forwardGuidedLearningRequest } from "@/lib/server/guided-learning-route";

export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ resourceRevisionId: string }> }) {
  const parsed = z.uuid().safeParse((await params).resourceRevisionId);
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  return forwardGuidedLearningRequest({ apiPath: `/v2/editor/learning-paths/source-sections/${parsed.data}`, method: "GET", request, responseSchema: V2EditorSourceSectionsSchema });
}
