import { V2HttpContracts, V2CatalogResponseSchema, V2HomeSnapshotSchema } from "@cediah/contracts";
import { forwardGuidedLearningRequest } from "@/lib/server/guided-learning-route";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
const names = ["publicPath", "enrollmentCreate", "enrollmentState", "attemptCreate", "attemptGet", "attemptHelp",
  "attemptImage", "attemptAlternative", "attemptResponse", "attemptComplete", "attemptHeartbeat", "upgradePreview", "upgradeCommit"] as const;

async function forward(request: Request, context: Context, method: "GET" | "POST") {
  const path = (await context.params).path;
  if (path.some((segment) => !/^[a-zA-Z0-9_-]+$/.test(segment))) return NextResponse.json({ error: "not_found" }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  const apiPath = `/v2/guided-learning/${path.join("/")}`;
  const query = new URL(request.url).search;
  if (method === "POST" && path.length === 3 && path[0] === "attempts" && path[2] === "feedback-viewed"
    && V2HttpContracts.attemptGet.params.safeParse({ id: path[1] }).success) {
    return forwardGuidedLearningRequest({ apiPath: apiPath + query, method, request, responseSchema: V2HttpContracts.attemptHeartbeat.response });
  }
  for (const name of names) {
    const contract = V2HttpContracts[name];
    const parts = contract.path.split("/").slice(3);
    if (contract.method !== method || parts.length !== path.length || parts.some((part, i) => !part.startsWith(":") && part !== path[i])) continue;
    const params = Object.fromEntries(parts.flatMap((part, i) => part.startsWith(":") ? [[part.slice(1), path[i]]] : []));
    if (!contract.params.safeParse(params).success) break;
    return forwardGuidedLearningRequest({ apiPath: apiPath + query, method, request, responseSchema: contract.response });
  }
  if (method === "GET" && path.length === 1 && ["paths", "home"].includes(path[0]!)) {
    return forwardGuidedLearningRequest({ apiPath: apiPath + query, method, request,
      responseSchema: path[0] === "paths" ? V2CatalogResponseSchema : V2HomeSnapshotSchema });
  }
  return NextResponse.json({ error: "not_found" }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
}
export async function GET(request: Request, context: Context) { return forward(request, context, "GET"); }
export async function POST(request: Request, context: Context) { return forward(request, context, "POST"); }
