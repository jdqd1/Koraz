const fs = require('node:fs');
const path = require('node:path');
const base = __dirname;
function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]); }
const selected = new Map();
for (const root of ['browser-artifacts', 'native-final-artifacts', 'map-final-artifacts', 'preview-final-artifacts', 'closure-artifacts', 'reflow-recheck-artifacts']) {
  const dir = path.join(base, root);
  if (!fs.existsSync(dir)) continue;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory())) {
    selected.set(entry.name, walk(path.join(dir, entry.name)));
  }
}
const files = [...selected.values()].flat();
const relative = file => path.relative(base, file).replaceAll('\\', '/');
const audits = files.filter(f => f.endsWith('-axe.json')).map(file => {
  const a = JSON.parse(fs.readFileSync(file));
  const geometry = JSON.parse(fs.readFileSync(file.replace('-axe.json', '-geometry.json')));
  return { file: relative(file), screenshot: relative(file.replace('-axe.json', '.png')), url: a.url,
    seriousCritical: a.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })),
    otherViolations: a.violations.filter(v => !['serious', 'critical'].includes(v.impact)).map(v => v.id),
    incomplete: a.incomplete.map(v => v.id), geometry };
});
fs.writeFileSync(path.join(base, 'audit-summary.json'), JSON.stringify({ audits: audits.length,
  seriousCritical: audits.reduce((n, a) => n + a.seriousCritical.length, 0),
  pageOverflows: audits.filter(a => a.geometry.pageWidth > a.geometry.viewport.width + 1).map(a => a.file), screens: audits }, null, 2));
fs.writeFileSync(path.join(base, 'accessibility-tree-summary.json'), JSON.stringify(audits.map(a => {
  const tree = JSON.parse(fs.readFileSync(path.join(base, a.file.replace('-axe.json', '-ax.json'))));
  const nodes = tree.nodes.filter(n => !n.ignored);
  return { screen: a.file, principalLandmarks: nodes.filter(n => ['main', 'region', 'dialog', 'alertdialog'].includes(n.role?.value)).map(n => ({ role: n.role.value, name: n.name?.value })),
    headingsAndStates: nodes.filter(n => ['heading', 'status', 'alert'].includes(n.role?.value)).map(n => ({ role: n.role.value, name: n.name?.value, children: n.childIds?.length ?? 0 })) };
}), null, 2));
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
fs.writeFileSync(path.join(base, 'gallery.html'), `<!doctype html><html lang="es"><meta charset="utf-8"><title>T037 · Evidencia visual</title>
<style>body{font:16px system-ui;background:#eef1f6;color:#152044;margin:24px}section{background:white;border-radius:12px;padding:18px;margin-bottom:24px}img{max-width:100%;height:auto;border:1px solid #ccd3e2}nav{display:flex;flex-wrap:wrap;gap:12px}a{color:#214596}h2{overflow-wrap:anywhere}</style>
<h1>T037 · Galería de UX y accesibilidad</h1><p>Fixtures sintéticos; Chromium, API y PostgreSQL aislados. Axe y árbol accesible complementan la inspección visual. Lector de pantalla y zoom nativo del navegador se informan por separado en README.md.</p>
<nav>${audits.map((a, i) => `<a href="#s${i}">${escape(a.screenshot.split('/').at(-1))}</a>`).join('')}</nav>
${audits.map((a, i) => `<section id="s${i}"><h2>${escape(a.screenshot)}</h2><p>Viewport ${a.geometry.viewport.width}×${a.geometry.viewport.height}; zoom CSS ${a.geometry.zoom}; ${a.seriousCritical.length} serious/critical.</p><p><a href="${a.file}">Axe</a> · <a href="${a.file.replace('-axe.json', '-ax.json')}">Árbol accesible</a> · <a href="${a.file.replace('-axe.json', '-geometry.json')}">Geometría</a> · <a href="${a.screenshot}">Página completa</a></p><img loading="lazy" src="${a.screenshot.replace('.png', '-viewport.png')}" alt="Captura ${escape(a.screenshot.split('/').at(-1))}"></section>`).join('')}</html>`);
console.log(JSON.stringify({ audits: audits.length, seriousCritical: audits.reduce((n, a) => n + a.seriousCritical.length, 0), overflows: audits.filter(a => a.geometry.pageWidth > a.geometry.viewport.width + 1).length }));
