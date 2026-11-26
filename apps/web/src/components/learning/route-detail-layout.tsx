import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CaretDown } from "@phosphor-icons/react/dist/ssr";
import { covers } from "./v2/model";
import { safeLearningOrigin } from "@/lib/learning-navigation";
import styles from "./v2/path-screen.module.css";

export function RouteDetailLayout({ title, summary, topic, coverKey, unitCount, origin, overview, children, engine }: {
  title: string; summary: string; topic: string; coverKey: keyof typeof covers; unitCount: number;
  origin?: string | null; overview: ReactNode; children: ReactNode; engine: string;
}) {
  const back = safeLearningOrigin(origin);
  return <article className={`learning-main learning-path-detail ${styles.screen}`} data-engine-version={engine}>
    <Link className={styles.back} href={back ?? "/aprendizaje?tab=rutas"}><ArrowLeft aria-hidden size={18} />{back?.startsWith("/aprendizaje/mapa") ? "Volver al mapa" : back ? "Volver al aprendizaje" : "Todas las rutas"}</Link>
    <header className={styles.header}><div className={styles.heading}><h1>{title}</h1><div className={styles.metadata}><span>{topic}</span><span>{unitCount} {unitCount === 1 ? "unidad" : "unidades"}</span></div><details className={styles.about}><summary>Acerca de esta ruta <CaretDown size={14} aria-hidden /></summary><p>{summary}</p></details></div><div className={styles.cover}><Image alt="" fill priority sizes="(max-width: 700px) 72px, 108px" src={covers[coverKey]} /></div></header>
    <div className={styles.overview}>{overview}</div>
    {children}
  </article>;
}
