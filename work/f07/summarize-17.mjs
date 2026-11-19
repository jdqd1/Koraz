import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const results = [];
const catalog = [];
const quantile = (sorted, fraction) => sorted[Math.ceil(sorted.length * fraction) - 1];
function metric(profile, mode, operation, values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length) results.push({profile, mode, operation, n: sorted.length, p50: Math.round(quantile(sorted, .5)),
    p75: Math.round(quantile(sorted, .75)), p95: Math.round(quantile(sorted, .95)), max: Math.round(sorted.at(-1))});
}
for (const root of process.argv.slice(2)) {
  for (const dir of readdirSync(root, { withFileTypes: true }).filter(entry => entry.isDirectory())) {
    const profile = dir.name.endsWith("-mobile") ? "mobile" : "desktop";
    for (const file of readdirSync(join(root, dir.name)).filter(name => /^(v2-interactions|interaction-measurements|panel-measurements|catalog-measurements|detail-measurements|detail-event)\.json$/.test(name))) {
      const json = JSON.parse(readFileSync(join(root, dir.name, file), "utf8"));
      const samples = json.samples ?? json.detailSamples ?? json;
      if (file === "detail-event.json") {
        metric(profile, "warm", root.includes("sintraza") ? "detail browser event without trace" : "detail browser event with trace", samples.map(item => item.eventToFrameMs));
        continue;
      }
      for (const mode of ["cold", "warm"]) {
        const rows = samples.filter(item => item.mode === mode);
        if (file.startsWith("v2-") || file.startsWith("interaction-")) {
          const v2 = file.startsWith("v2-");
          for (const operation of ["launch", "resume", "confirmation"]) {
            const times = rows.map(item => item[v2 ? operation : operation + "Timing"]);
            metric(profile, mode, (v2 ? "V2 " : "V1 ") + operation, times.map(item => item.eventToFrameMs));
            metric(profile, mode, (v2 ? "V2 " : "V1 ") + operation + " busy", times.map(item => item.busyFrameMs));
          }
        } else if (file.startsWith("panel")) metric(profile, mode, "panel", rows.map(item => item.timing.eventToFrameMs));
        else if (file.startsWith("detail")) metric(profile, mode, "detail", rows.map(item => item.usableMs));
        else if (mode === "warm") {
          metric(profile, mode, "catalog", rows.map(item => item.timing.eventToFrameMs));
          for (const row of rows) {
            const nav = row.browserRequests.find(req => req.path === "/aprendizaje?tab=rutas" && !req.prefetch && req.responseMs != null);
            catalog.push({ profile, frame: row.timing.eventToFrameMs, documentChanged: row.timing.documentChanged,
              startToHeaders: nav ? Math.round(nav.responseMs - nav.startMs) : null,
              v2Ms: Math.round(row.trace.find(t => t.path.includes("includeState=true"))?.durationMs ?? 0) });
          }
        } else metric(profile, mode, "catalog", rows.map(item => item.usableMs));
      }
    }
  }
}
writeFileSync("output/implementacion-aprendizaje-2026-11-04/f07-percentiles-17.json", JSON.stringify({sampleDirectories: process.argv.slice(2), results, catalog}, null, 2) + "\n");
