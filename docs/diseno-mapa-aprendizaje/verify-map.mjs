import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const require = createRequire(new URL("../../apps/web/package.json", import.meta.url));
const { chromium } = require("@playwright/test");
const label = process.argv[2] ?? "after";
const output = new URL(`./${label}/`, import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, reducedMotion: "reduce" });
    await page.addInitScript(() => {
      window.__mapCommits = 0;
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
        supportsFiber: true, renderers: new Map(),
        inject(renderer) { this.renderers.set(1, renderer); return 1; },
        onCommitFiberRoot() { window.__mapCommits++; },
        onCommitFiberUnmount() {},
      };
    });
    for (const state of ["root", "large"]) {
      await page.goto(`http://localhost:3000/visual-fixtures/mapa?estado=${state}`);
      await page.locator(".react-flow__node article").first().waitFor();
      await page.getByRole("button", { name: "Ajustar vista", exact: true }).click();
      await page.waitForTimeout(600);
      const region = page.getByRole("region", { name: /Mapa del nivel/ });
      await region.evaluate(el => { el.scrollTop = 0; });
      await page.waitForTimeout(200);
      const metrics = await region.evaluate(async (el) => {
        const commits = window.__mapCommits;
        const frames = [];
        const counts = [];
        let last = performance.now();
        for (let index = 0; index < 40; index++) {
          await new Promise(requestAnimationFrame);
          const now = performance.now();
          frames.push(now - last);
          last = now;
          el.scrollTop += 12;
          counts.push(document.querySelectorAll(".react-flow__node article").length);
        }
        await new Promise(requestAnimationFrame);
        frames.sort((a, b) => a - b);
        return { scrollCommits: window.__mapCommits - commits, maxRenderedCards: Math.max(...counts),
          frameP95Ms: Number(frames[Math.ceil(frames.length * .95) - 1].toFixed(2)),
          scrollTop: el.scrollTop, pageOverflows: document.documentElement.scrollWidth > innerWidth };
      });
      results.push({ width, state, ...metrics });
      if (state === "root") await page.screenshot({ path: fileURLToPath(new URL(`map-${width}.png`, output)), fullPage: true });
    }
    await page.close();
  }
} finally { await browser.close(); }
await writeFile(new URL("performance.json", output), JSON.stringify({
  environment: "Local Next development; Chromium; 40 animation-frame scroll steps; synthetic fixture",
  results,
}, null, 2));
console.log(JSON.stringify(results));
