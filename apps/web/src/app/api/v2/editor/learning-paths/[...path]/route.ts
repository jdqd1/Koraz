import { V2HttpContracts } from "@cediah/contracts";
import { forwardGuidedLearningRequest } from "@/lib/server/guided-learning-route";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
const names = ["editorGet", "editorPatch", "editorValidate", "editorTransition", "editorExport", "editorVersion", "importValidate", "importCommit"] as const;
async function forward(request: Request, context: Context, method: "GET" | "PATCH" | "POST") {
  const path = (await context.params).path;
  for (const name of names) {
    const contract = V2HttpContracts[name];
    const segments = contract.path.split("/").slice(4);
    if (contract.method !== method || segments.length !== path.length) continue;
    const params: Record<string, string> = {};
    if (!segments.every((part, index) => { if (part === ":id") { params.id = path[index]!; return true; } return part === path[index]; }) || !contract.params.safeParse(params).success) continue;
    return forwardGuidedLearningRequest({ apiPath: `/v2/editor/learning-paths/${path.map(encodeURIComponent).join("/")}`, method, request, responseSchema: contract.response });
  }
  return Response.json({ error: "not_found" }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
}
export async function GET(request: Request, context: Context) { return forward(request, context, "GET"); }
export async function PATCH(request: Request, context: Context) { return forward(request, context, "PATCH"); }
export async function POST(request: Request, context: Context) { return forward(request, context, "POST"); }
