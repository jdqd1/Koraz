import { notFound } from "next/navigation";
import { EditorV2FixtureWorkspace } from "@/components/learning/editor/v2/editor-fixture-workspace";

export const dynamic = "force-dynamic";
export default async function EditorV2FixturePage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const query = await searchParams;
  const mode = query.estado === "conflict" || query.estado === "empty" || query.estado === "published" || query.estado === "network" ? query.estado : "ready";
  return <EditorV2FixtureWorkspace key={mode} mode={mode} />;
}
