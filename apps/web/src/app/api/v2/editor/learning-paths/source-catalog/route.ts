import { V2HttpContracts } from "@cediah/contracts";
import { forwardGuidedLearningRequest } from "@/lib/server/guided-learning-route";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const endpoint = V2HttpContracts.editorSourceCatalog;
  const searchParams = new URL(request.url).searchParams;
  if ([...searchParams.keys()].some((key) => searchParams.getAll(key).length > 1)) return Response.json({ error: "invalid_request" }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  const query = endpoint.query.safeParse(Object.fromEntries(searchParams));
  if (!query.success) return Response.json({ error: "invalid_request" }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  const search = new URLSearchParams({ limit: String(query.data.limit) });
  if (query.data.q) search.set("q", query.data.q);
  if (query.data.cursor) search.set("cursor", query.data.cursor);
  return forwardGuidedLearningRequest({ apiPath: `${endpoint.path}?${search}`, method: "GET", request, responseSchema: endpoint.response });
}
