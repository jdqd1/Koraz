import { writeFile, readFile } from "node:fs/promises";
import { it, vi, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { V2ReviewScreen } from "../../../../../apps/web/src/components/learning/v2/review";
import { studentFixture } from "../../../../../apps/web/src/components/learning/v2/fixtures";
import maintenance from "../../../../../apps/web/src/components/learning/v2/maintenance.module.css";
import shared from "../../../../../apps/web/src/components/learning/v2/styles.module.css";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

it("exports static review states with the existing learning styles for visual inspection", async () => {
  const root = new URL("../../../../../", import.meta.url);
  let css = "";
  for (const file of ["globals.css", "koras-theme.css", "platform-chrome.css", "learning.css", "identity-v3.css", "interface-polish.css"]) {
    css += await readFile(new URL(`apps/web/src/app/${file}`, root), "utf8");
  }
  for (const [file, classes] of [["maintenance.module.css", maintenance], ["styles.module.css", shared]] as const) {
    const source = await readFile(new URL(`apps/web/src/components/learning/v2/${file}`, root), "utf8");
    css += source.replace(/\.([a-zA-Z][\w-]*)/g, (selector, key: string) => classes[key] ? `.${classes[key]}` : selector);
  }
  css += `:root{--font-plus-jakarta:"Preview Jakarta"}@font-face{font-family:"Preview Jakarta";font-weight:400;src:url("${new URL("apps/web/public/fonts/PlusJakartaSans-Regular.ttf", root).href}")}@font-face{font-family:"Preview Jakarta";font-weight:700;src:url("${new URL("apps/web/public/fonts/PlusJakartaSans-Bold.ttf", root).href}")}`;
  for (const mode of ["critical", "review", "consolidated", "none", "missing", "revoked"]) {
    const fixture = studentFixture(mode);
    const html = renderToString(<V2ReviewScreen path={fixture.path} state={mode === "missing" ? null : fixture.state} />);
    expect(html).toContain("guided-v2");
    await writeFile(new URL(`preview-${mode}.html`, import.meta.url), `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>T032 — vista estática</title><style>body{margin:0;font-family:Arial,sans-serif;background:#f7f9fc;color:#17253b}*{box-sizing:border-box}${css}</style></head><body>${html}</body></html>`);
  }
});
