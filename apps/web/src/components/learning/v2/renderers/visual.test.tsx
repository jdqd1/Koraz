import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { V2PublicActivity } from "@cediah/contracts";
import { containedImageRect, ImageTargetRenderer, normalizedImagePoint } from "./image-target";
import { completePairs, MatchRenderer } from "./match";

const base = { key: "visual", objectiveKey: "objective", phase: "apply" as const, representation: "image" as const, prompt: "Ejemplo sintético" };
const match: Extract<V2PublicActivity, { kind: "match" }> = { ...base, kind: "match", payload: { presentation: "pairs", prompts: [{ key: "p1", text: "Elemento A" }, { key: "p2", text: "Elemento B" }], choices: [{ key: "c1", text: "Relación A" }, { key: "c2", text: "Relación B" }], allowReuse: false } };
const image: Extract<V2PublicActivity, { kind: "image_target" }> = { ...base, kind: "image_target", payload: { assetKey: "image", mode: "hotspot", targets: [], labels: [], masking: "no_labels" } };
describe("T030 geometry and public renderers", () => {
  it.each([{ width: 1440, height: 360 }, { width: 360, height: 300 }, { width: 768, height: 1024 }, { width: 2880, height: 720 }])("same relative point at $width x $height", size => {
    const box = { left: 30, top: 50, ...size }, natural = { width: 800, height: 400 };
    const rect = containedImageRect(box, natural)!;
    expect(normalizedImagePoint({ x: rect.left + .25 * rect.width, y: rect.top + .75 * rect.height }, box, natural)).toEqual({ x: .25, y: .75 });
    expect(normalizedImagePoint({ x: rect.left, y: rect.top }, box, natural)).toEqual({ x: 0, y: 0 });
    expect(normalizedImagePoint({ x: rect.left + rect.width, y: rect.top + rect.height }, box, natural)).toEqual({ x: 1, y: 1 });
  });
  it("rejects vertical and horizontal letterboxing", () => {
    const natural = { width: 800, height: 400 };
    expect(normalizedImagePoint({ x: 200, y: 1 }, { left: 0, top: 0, width: 400, height: 400 }, natural)).toBeNull();
    expect(normalizedImagePoint({ x: 1, y: 200 }, { left: 0, top: 0, width: 800, height: 400 }, { width: 200, height: 400 })).toBeNull();
  });
  it.each([0, -1, NaN, Infinity])("rejects unavailable or invalid image size %s", width => {
    expect(containedImageRect({ left: 0, top: 0, width, height: 400 }, { width: 800, height: 400 })).toBeNull();
  });
  it("rejects nonfinite and outside points", () => {
    for (const point of [{ x: NaN, y: 0 }, { x: 401, y: 100 }, { x: -1, y: 100 }]) expect(normalizedImagePoint(point, { left: 0, top: 0, width: 400, height: 200 }, { width: 800, height: 400 })).toBeNull();
  });
  it("requires complete known relations and honors reuse", () => {
    expect(completePairs(match, { p1: "c1" })).toBe(false);
    expect(completePairs(match, { p1: "c1", p2: "unknown" })).toBe(false);
    expect(completePairs(match, { p1: "c1", p2: "c1" })).toBe(false);
    expect(completePairs(match, { p1: "c1", p2: "c2" })).toBe(true);
    expect(completePairs({ ...match, payload: { ...match.payload, allowReuse: true } }, { p1: "c1", p2: "c1" })).toBe(true);
  });
  it.each(["pairs", "comparison_table", "causal_map"] as const)("renders accessible %s selectors without solutions", presentation => {
    const html = renderToStaticMarkup(<MatchRenderer activity={{ ...match, payload: { ...match.payload, presentation } }} disabled={false} onSubmit={() => {}} />);
    expect(html.match(/<select/g)).toHaveLength(2); expect(html).toContain("Elemento A"); expect(html).not.toContain("correctByPrompt");
    if (presentation === "comparison_table") expect(html).toContain('scope="row"');
  });
  it("blocks image submissions without authorized media or hotspot identity", () => {
    const html = renderToStaticMarkup(<ImageTargetRenderer activity={image} image={null} disabled={false} onSubmit={() => {}} />);
    expect(html).toContain("imagen autorizada no está disponible"); expect(html).toContain("Falta la consigna autorizada"); expect(html).toContain("disabled"); expect(html).not.toContain("polygon");
  });
  it("never substitutes a different asset binding", () => {
    const html = renderToStaticMarkup(<ImageTargetRenderer activity={image} image={{ assetKey: "other", src: "/private-image", alt: "Figura" }} disabled={false} onSubmit={() => {}} />);
    expect(html).not.toContain("/private-image");
  });
  it("labels numbered public markers without mappings or polygons", () => {
    const html = renderToStaticMarkup(<ImageTargetRenderer activity={{ ...image, payload: { ...image.payload, mode: "labeling", targets: [{ key: "target", prompt: "Identifica el punto", marker: { x: .2, y: .3 } }], labels: [{ key: "label", text: "Opción A" }] } }} image={{ assetKey: "image", src: "/private-image", alt: "Figura sintética" }} disabled={true} onSubmit={() => {}} />);
    expect(html).toContain("Punto 1: Identifica el punto"); expect(html).toContain("Opción A"); expect(html).not.toContain("correctLabelByTarget"); expect(html).not.toContain("polygon");
    expect(html).toContain('aria-label="Área ampliada de imagen" tabindex="0"');
  });
});
