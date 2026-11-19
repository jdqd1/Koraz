import { test, expect, type Request, type Response } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { installBrowserTiming, measureClick, type BrowserTiming } from "./learning-browser-timing";

test("F07 measures the usable route detail from the browser click", async ({page}, info) => {
  await installBrowserTiming(page);
  await page.context().addCookies([{ name: "t035", value: info.project.name === "mobile" ? "student-38" : "student-37", domain: "127.0.0.1", path: "/" }]);
  await page.clock.setFixedTime(new Date("2026-10-04T12:00:00Z"));
  const { fixtures } = await (await page.request.get("http://127.0.0.1:41035/__test/ready")).json();
  for (const key of ["small", "admission", "large"]) {
    expect((await page.request.post("/api/v2/guided-learning/enrollments", {
      data: { pathId: fixtures[key].pathId }, headers: { "idempotency-key": crypto.randomUUID() },
    })).status()).toBe(200);
  }
  const samples: (BrowserTiming & { requests: { kind: string; prefetch: boolean; headersMs?: number; finishedMs?: number }[] })[] = [];
  for (let index = 0; index < 30; index++) {
    await page.goto("/aprendizaje?tab=rutas");
    const link = page.getByRole("link", { name: "Abrir ruta Ruta T035 pequeña", exact: true });
    await expect.poll(() => link.evaluate(el => Object.entries(el).some(([key, props]) =>
      key.startsWith("__reactProps") && typeof (props as { onClick?: unknown }).onClick === "function"))).toBe(true);
    const requests = new Map<Request, { kind: string; prefetch: boolean; headersMs?: number; finishedMs?: number }>();
    const starts = new Map<Request, number>();
    const start = (req: Request) => {
      if (new URL(req.url()).pathname !== "/aprendizaje/rutas/t035-small") return;
      starts.set(req, performance.now());
      requests.set(req, { kind: req.resourceType(), prefetch: !!req.headers()["next-router-prefetch"] });
    };
    const headers = (res: Response) => {
      const req = res.request(), row = requests.get(req);
      if (row) row.headersMs = Math.round(performance.now() - starts.get(req)!);
    };
    const finish = (req: Request) => {
      const row = requests.get(req);
      if (row) row.finishedMs = Math.round(performance.now() - starts.get(req)!);
    };
    page.on("request", start); page.on("response", headers); page.on("requestfinished", finish);
    const timing = await measureClick(page, link,
      'article.learning-path-detail:has(header h1):has(details#leccion-unit[open]) [aria-label="Acción recomendada"] button', "Continuar");
    page.off("request", start); page.off("response", headers); page.off("requestfinished", finish);
    samples.push({ ...timing, requests: [...requests.values()] });
    await expect(page.getByRole("heading", { name: "Ruta T035 pequeña", exact: true })).toBeVisible();
    await expect(page.locator("#leccion-unit:visible")).toHaveAttribute("open", "");
  }
  await writeFile(info.outputPath("detail-event.json"), JSON.stringify(samples, null, 2));
});
