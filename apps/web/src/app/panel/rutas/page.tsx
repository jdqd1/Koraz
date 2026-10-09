import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { LearningPathsEditorIndex } from "@/components/learning/editor/learning-paths-editor-index";
import styles from "@/components/learning/editor/route-editor.module.css";
import { getCurrentUser } from "@/lib/server/current-user";
import { getLearningEditorWorkspace } from "@/lib/server/guided-learning-api";
import { requestContentApi } from "@/lib/server/content-api";
import { getApiRequestCookie } from "@/lib/server/api-session";
import { editorV2CatalogAvailable } from "@/components/learning/editor/v2/new-draft";

export const dynamic = "force-dynamic";

export default async function LearningPathsEditorPage() {
  const current = await getCurrentUser();
  if (current.status === "anonymous") redirect("/acceder?next=/panel/rutas");
  if (current.status !== "authenticated") return <EditorGate title="No pudimos confirmar tu sesión" />;
  if (!current.features.guidedLearning) notFound();
  const paths = await getLearningEditorWorkspace();
  if (paths.status !== "ready") {
    return <EditorGate title={paths.status === "forbidden" ? "Esta cuenta no tiene permisos editoriales" : "No pudimos abrir tus rutas"} />;
  }

  const canArchive = current.roles.includes("coordinator") || current.roles.includes("administrator");
  const session = await getApiRequestCookie();
  const v2Catalog = session.status === "ready" ? await requestContentApi({ cookie: session.cookie, method: "GET", path: "/v2/editor/learning-paths/source-catalog?limit=1" }) : { status: 401, body: null };
  return <><div className={styles.inlineActions}>{editorV2CatalogAvailable(v2Catalog) ? <Link className={styles.secondaryButton} href="/panel/rutas/nueva?mode=v2">Crear ruta v2</Link> : null}<Link className={styles.secondaryButton} href="/panel/rutas/nueva?mode=import">Importar ruta</Link></div><LearningPathsEditorIndex canArchive={canArchive} paths={paths.items} /></>;
}

function EditorGate({ title }: { title: string }) {
  return <main className={styles.editor}><section className={styles.card}><h1>{title}</h1><p>La sesión sigue protegida. Vuelve al panel o intenta actualizar más tarde.</p><Link href="/panel">Volver al panel</Link></section></main>;
}
