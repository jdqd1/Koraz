import type { RoutePackage } from "@cediah/contracts";

export function sourceLabelV2(sources: RoutePackage["sources"], source: RoutePackage["sources"][number]) {
  const title = source.title || "Fuente sin título";
  if (sources.filter(item => item.title === source.title).length < 2) return title;
  return `${title} · ${source.locator.heading || source.locator.sectionPath.at(-1) || `Fragmento ${sources.indexOf(source) + 1}`}`;
}
