import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { LearningPathScreen } from "./learning-path-screen";
import { learningVisualPathDetail } from "./learning-visual-fixtures";
import { LessonDetailPanel } from "./map/lesson-detail-panel";
import { mapVisualLevel, mapFixtureId } from "./map/map-visual-fixtures";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("./map/map-provider", () => ({ useMapWorkspace: () => ({ client: {}, level: null }) }));

describe("essential activity visibility (H03)", () => {
  it("keeps video-only steps and steps without alternatives in the route", () => {
    const path = structuredClone(learningVisualPathDetail);
    const unit = path.version.units[0]!;
    const step = unit.steps[0]!;
    step.title = "Video esencial visible";
    step.options = [{ ...step.options[0]!, projection: "video", label: "Ver video" }];
    unit.steps = [step, { ...step, id: "a1000000-0000-4000-8000-000000009999", title: "Paso sin material", options: [] }];
    path.version.units = [unit];
    const html = renderToString(<LearningPathScreen path={path} progress={null} upgrade={null} />);
    expect(html).toContain("Video esencial visible");
    expect(html).toContain("Ver video");
    expect(html).toContain("Paso sin material");
    expect(html).toContain("Material no disponible");
  });

  it("keeps the same activity set in the map panel", () => {
    const level = mapVisualLevel({ nodeId: mapFixtureId(2), entryId: mapFixtureId(200), unitStableKey: "leccion-0" });
    const lesson = level.selectedLesson!;
    expect(lesson).not.toBeNull();
    lesson.activities[0]!.title = "Video esencial visible";
    lesson.activities[0]!.options[0]!.projection = "video";
    lesson.activities[1]!.title = "Paso sin material";
    lesson.activities[1]!.options = [];
    const html = renderToString(<LessonDetailPanel lesson={lesson} onClose={vi.fn()} />);
    expect(html).toContain("Video esencial visible");
    expect(html).toContain("Paso sin material");
    expect(html).toContain("Material no disponible");
  });
});
