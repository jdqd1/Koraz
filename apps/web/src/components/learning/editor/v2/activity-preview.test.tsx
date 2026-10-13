import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { toV2PublicActivity, V2PublicActivitySchema } from "@cediah/contracts";
import { activityCatalogV2, activityExampleV2, activityPresetGroupsV2 } from "./activity-catalog";
import { ActivityStudentPreviewV2 } from "./activity-student-preview";
import { activityTypesV2 } from "./activity-model";
import { editorV2FixturePackage } from "./editor-fixtures";

describe("activity examples and student preview", () => {
  const presets = activityPresetGroupsV2.flatMap(group => group.presets);
  it("explains all available presets and declares their creation count", () => {
    expect(presets).toHaveLength(13);
    expect(new Set(presets)).toEqual(new Set(Object.keys(activityTypesV2)));
    for (const preset of presets) {
      expect(activityCatalogV2[preset].purpose.length).toBeGreaterThan(30);
      expect(activityCatalogV2[preset].when.length).toBeGreaterThan(30);
    }
    expect(activityCatalogV2.mechanism.count).toBe(2);
    expect(activityCatalogV2.error.count).toBe(3);
  });
  it.each(presets)("renders an interactive %s example from student DTOs", preset => {
    const examples = activityExampleV2(preset);
    for (const item of examples) expect(V2PublicActivitySchema.safeParse(toV2PublicActivity(item)).success).toBe(true);
    const html = renderToStaticMarkup(<ActivityStudentPreviewV2 activity={examples[0]!} activities={examples} example />);
    expect(html).toContain("Ejemplo interactivo");
    expect(html).toContain("Reiniciar");
    expect(html).toContain(examples[0]!.prompt.replace(/&/g, "&amp;"));
    expect(html).not.toContain("Respuesta modelo");
    expect(html).not.toContain("Criterios para comparar");
  });
  it("can preview an unfinished case without throwing or inventing a child", () => {
    const item = activityExampleV2("case")[0]!;
    if (item.kind !== "case") throw new Error("Expected case");
    item.payload.stages = [];
    expect(renderToStaticMarkup(<ActivityStudentPreviewV2 activity={item} />)).toContain("Vincula una pregunta");
  });
  it("does not mutate the draft or reveal solutions before the student's response", () => {
    const pkg = editorV2FixturePackage();
    const before = JSON.stringify(pkg);
    for (const item of pkg.activities) {
      const html = renderToStaticMarkup(<ActivityStudentPreviewV2 activity={item} activities={pkg.activities} assets={pkg.assets} />);
      expect(html).not.toContain("Opción correcta");
      expect(html).not.toContain("Respuesta modelo");
    }
    expect(JSON.stringify(pkg)).toBe(before);
  });
});
