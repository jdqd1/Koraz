import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { editorFixture } from "./editor-fixtures";
import { LearningPathsEditorIndex } from "./learning-paths-editor-index";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("learning paths editor index", () => {
  it("shows a published v2 route even when there are no legacy routes", () => {
    const path = { pathId: "72000000-0000-4000-8000-000000000099", title: "Vascularización del abdomen", topicTitle: "Anatomía", unitCount: 4, status: "published" as const, versionNumber: 1, archivedAt: null };
    const html = renderToStaticMarkup(<LearningPathsEditorIndex paths={[]} v2Paths={[path]} />);
    expect(html).toContain(path.title);
    expect(html).toContain(`href="/panel/rutas/${path.pathId}"`);
    expect(html).toContain("4 unidades");
    expect(html).toContain("Publicada");
    expect(html).not.toContain("Aún no hay rutas");
    expect(html).not.toContain("Eliminar ruta Vascularización");
  });

  it("keeps legacy routes visible while reporting a failed v2 catalogue", () => {
    const path = editorFixture("ready").initialPath!;
    const html = renderToStaticMarkup(<LearningPathsEditorIndex paths={[path]} v2Unavailable />);
    expect(html).toContain(path.title);
    expect(html).toContain("No pudimos cargar todas tus rutas");
  });

  it("offers a clearly labelled delete action for an existing route", () => {
    const path = editorFixture("ready").initialPath!;
    const html = renderToStaticMarkup(<LearningPathsEditorIndex paths={[path]} />);

    expect(html).toContain(`href="/panel/rutas/${path.id}"`);
    expect(html).toContain(`aria-label="Eliminar ruta ${path.title}"`);
    expect(html).toContain("Eliminar");
  });

  it("offers both archiving and deletion when the route has publication history", () => {
    const path = {
      ...editorFixture("ready").initialPath!,
      version: { ...editorFixture("ready").initialPath!.version, number: 4 },
    };
    const html = renderToStaticMarkup(<LearningPathsEditorIndex canArchive paths={[path]} />);

    expect(html).toContain("Borrador de ruta publicada");
    expect(html).toContain(`aria-label="Archivar ruta ${path.title}"`);
    expect(html).toContain(`aria-label="Eliminar ruta ${path.title}"`);
  });

  it("offers restoration for archived routes with publication permission", () => {
    const path = editorFixture("archived").initialPath!;
    const html = renderToStaticMarkup(<LearningPathsEditorIndex canArchive paths={[path]} />);

    expect(html).toContain("Archivada");
    expect(html).toContain(`aria-label="Desarchivar ruta ${path.title}"`);
    expect(html).toContain(`aria-label="Eliminar ruta ${path.title}"`);
    expect(html).not.toContain(`aria-label="Archivar ruta ${path.title}"`);
    expect(renderToStaticMarkup(<LearningPathsEditorIndex paths={[path]} />)).not.toContain(`aria-label="Desarchivar ruta ${path.title}"`);
  });
});
