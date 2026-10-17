#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const normalized = value => String(value ?? '').normalize('NFKC').toLocaleLowerCase('es').replace(/\s+/g, ' ').trim();
export function reviewAuthoring(pkg) {
  const issues = [];
  const sources = Array.isArray(pkg?.sources) ? pkg.sources : [];
  const activities = Array.isArray(pkg?.activities) ? pkg.activities : [];
  const report = (code, path, message) => issues.push({ code, path, message });
  const names = new Map(), errors = new Map(), prompts = new Map();
  for (const [index, source] of sources.entries()) {
    const title = normalized(source.title);
    if (title && names.has(title)) report('REPEATED_SOURCE_TITLE', `/sources/${index}/title`, 'Añade la sección específica para distinguir esta fuente.');
    if (title) names.set(title, index);
  }
  for (const [index, activity] of activities.entries()) {
    const error = normalized(activity.feedback?.commonError);
    if (error && errors.has(error)) report('REPEATED_COMMON_ERROR', `/activities/${index}/feedback/commonError`, `Corrección idéntica a la actividad ${errors.get(error) + 1}; revisa que responda a esta tarea.`);
    if (error) errors.set(error, index);
    const body = activity.kind === 'study' ? normalized(activity.payload?.body) : '';
    const backing = sources.filter(source => activity.sourceKeys?.includes(source.key));
    if (body.length >= 120 && backing.some(source => normalized(source.excerpt).includes(body))) report('COPIED_EXPLANATION', `/activities/${index}/payload/body`, 'La explicación reproduce el fragmento de la fuente; reescríbela para enseñar la relación.');
    const prompt = normalized(activity.prompt);
    if (prompt) { const group = prompts.get(prompt) ?? []; group.push({ activity, index }); prompts.set(prompt, group); }
  }
  for (const group of prompts.values()) {
    if (group.length < 2 || !group.some(entry => ['diagnostic', 'final', 'retention7', 'retention30'].includes(entry.activity.use))) continue;
    for (const { index } of group.slice(1)) report('REPEATED_RESERVED_QUESTION', `/activities/${index}/prompt`, 'Enunciado idéntico compartido con una evaluación reservada. Revisa la independencia real de la demanda.');
  }
  return { scope: 'authoring-hygiene', authoringChecksPassed: issues.length === 0, semanticReview: 'REQUIRED', issues };
}

function selfTest() {
  const excerpt = 'Contenido de referencia para comprobar que una explicación docente no se limita a copiar exactamente el mismo párrafo de la fuente. '.repeat(2);
  const source = { key: 's', title: 'Guía · Primera sección', excerpt };
  const activity = { key: 'a', kind: 'study', use: 'learning', prompt: 'Comprende la relación', sourceKeys: ['s'], payload: { body: 'Voy a comparar las dos ideas para explicar qué las conecta.' }, feedback: { commonError: 'Confundir el orden: revisa cuál es el punto de partida.' } };
  assert.equal(reviewAuthoring({ sources: [source], activities: [activity] }).authoringChecksPassed, true);
  const bad = { sources: [source, { ...source, key: 's2' }], activities: [{ ...activity, payload: { body: excerpt } }, { ...activity, key: 'b', use: 'final' }] };
  assert.deepEqual(new Set(reviewAuthoring(bad).issues.map(issue => issue.code)), new Set(['REPEATED_SOURCE_TITLE', 'COPIED_EXPLANATION', 'REPEATED_COMMON_ERROR', 'REPEATED_RESERVED_QUESTION']));
  assert.equal(reviewAuthoring({ sources: [source], activities: [{ ...activity, feedback: { commonError: '' } }, { ...activity, prompt: 'Otra tarea', feedback: { commonError: '' } }] }).authoringChecksPassed, true);
  console.log('Authoring self-check: PASS');
}

try {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--self-test') selfTest();
  else {
    if (args.length !== 1 || !args[0].endsWith('.koraz-route.json')) throw new Error('Uso: node scripts/review-authoring.mjs ruta.koraz-route.json');
    const bytes = readFileSync(args[0]);
    if (bytes.length > 10 * 1024 * 1024) throw new Error('El paquete supera 10 MiB.');
    const pkg = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
    if (!pkg || !Array.isArray(pkg.sources) || !Array.isArray(pkg.activities)) throw new Error('Faltan fuentes o actividades; ejecuta primero el validador estructural.');
    const result = reviewAuthoring(pkg);
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.authoringChecksPassed ? 0 : 1;
  }
} catch (error) {
  console.error(JSON.stringify({ scope: 'authoring-hygiene', error: error.message }));
  process.exitCode = 2;
}
