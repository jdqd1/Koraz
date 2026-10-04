"use client";

import { FieldV2, type FormPropsV2 } from "./sources-fields";
import { SourcesV2, useSourceCatalogV2 } from "./sources";
import type { RoutePackage } from "@cediah/contracts";
import styles from "../route-editor.module.css";
import local from "./styles.module.css";

const disciplines: Record<RoutePackage["route"]["discipline"], string> = { anatomy: "Anatomía", histology: "Histología", embryology: "Embriología", physiology: "Fisiología", biochemistry: "Bioquímica", pharmacology: "Farmacología", pathology: "Patología", clinical: "Clínica", general: "General" };
const covers = { lungs: "Pulmones", heart: "Corazón", skull: "Cráneo", "neck-muscles": "Cuello", intestines: "Abdomen", pelvis: "Pelvis", thigh: "Muslo", "back-muscles": "Espalda" } as const;
export function RouteBasicsV2(props: FormPropsV2 & { preserveSlug: boolean }) {
  const { draft, disabled, onChange, issues } = props;
  const catalog = useSourceCatalogV2();
  const route = draft.package.route;
  function patch(values: Partial<typeof route>) { onChange({ ...draft, package: { ...draft.package, route: { ...route, ...values } } }); }
  return <div className={local.stack}><section className={styles.card}><div className={styles.sectionHeading}><div><span>Paso 1 de 5</span><h2>Datos y fuentes</h2><p>Los cambios se guardan cuando confirmas el borrador.</p></div></div><fieldset className={styles.fieldset} disabled={disabled}><legend className={local.visuallyHidden}>Datos de la ruta</legend><div className={styles.fieldGrid}>
    <FieldV2 label="Título" path="package.route.title" issues={issues} wide>{(input) => <input {...input} maxLength={200} required value={route.title} onChange={(event) => { const title = event.target.value; patch({ title, ...(!props.preserveSlug ? { slug: title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 200).replace(/-$/, "") } : {}) }); }} />}</FieldV2>
    <FieldV2 label="Tema del catálogo" path="bindings.topicContentId" issues={issues}>{(input) => <select {...input} value={draft.bindings.topicContentId} onChange={(event) => { const topic = catalog.catalog.topics.find((item) => item.id === event.target.value); if (topic) onChange({ ...draft, bindings: { ...draft.bindings, topicContentId: topic.id }, package: { ...draft.package, route: { ...route, topicLabel: topic.title } } }); }}>{!catalog.catalog.topics.some((topic) => topic.id === draft.bindings.topicContentId) ? <option value={draft.bindings.topicContentId}>{draft.bindings.topicContentId ? `Tema vinculado · ${route.topicLabel}` : "Selecciona un tema"}</option> : null}{catalog.catalog.topics.map((topic) => <option value={topic.id} key={topic.id}>{topic.title}</option>)}</select>}</FieldV2>
    <FieldV2 label="Nombre del tema" path="package.route.topicLabel" issues={issues}>{(input) => <input {...input} maxLength={240} required value={route.topicLabel} onChange={(event) => patch({ topicLabel: event.target.value })} />}</FieldV2>
    <FieldV2 label="Descripción" path="package.route.summary" issues={issues} wide>{(input) => <textarea {...input} maxLength={2000} required rows={3} value={route.summary} onChange={(event) => patch({ summary: event.target.value })} />}</FieldV2>
    <FieldV2 label="Dirigida a" path="package.route.audience" issues={issues}>{(input) => <input {...input} maxLength={240} required value={route.audience} onChange={(event) => patch({ audience: event.target.value })} />}</FieldV2>
    <FieldV2 label="Disciplina" path="package.route.discipline" issues={issues}>{(input) => <select {...input} value={route.discipline} onChange={(event) => patch({ discipline: event.target.value as typeof route.discipline })}>{Object.entries(disciplines).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}</FieldV2>
    <FieldV2 label="Portada" path="package.route.coverKey" issues={issues}>{(input) => <select {...input} value={route.coverKey} onChange={(event) => patch({ coverKey: event.target.value as typeof route.coverKey })}>{Object.entries(covers).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}</FieldV2>
  </div></fieldset></section><SourcesV2 {...props} {...catalog} /></div>;
}
