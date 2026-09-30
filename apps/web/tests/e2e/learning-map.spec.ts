import { test, expect } from "@playwright/test";
const root = "/visual-fixtures/mapa";
const node = "b1000000-0000-4000-8000-000000000001",
  block = "b1000000-0000-4000-8000-000000000022";
test("published routes do not expose personal-node creation", async ({ page }) => {
  await page.goto(root);
  await page.getByLabel("Opciones de Anatomía", { exact: true }).click();
  await expect(page.getByRole("button", { name: "Seleccionar", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /crear nodo|agregar contenido/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Abrir vistas de aprendizaje" })).toHaveCount(0);
});
test("card colors persist locally without a views panel", async ({ page }, testInfo) => {
  await page.goto(root);
  await expect(page.getByRole("button", { name: "Abrir Anatomía" })).toBeVisible();
  const initialUrl = page.url();
  await expect(page.getByRole("complementary", { name: "Resumen de aprendizaje" })).toHaveCount(0);
  if (testInfo.project.name === "desktop") {
    await page.setViewportSize({ width: 1024, height: 900 });
    await expect(page.locator('[data-mobile="false"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.screenshot({ path: testInfo.outputPath("routes.png"), fullPage: true });
  expect(page.url()).toBe(initialUrl);
  await page.getByLabel("Opciones de Anatomía", { exact: true }).click();
  await page.getByRole("button", { name: "Cambiar color del icono" }).click();
  await page.getByRole("dialog", { name: "Color de Anatomía" }).getByRole("button", { name: "Coral" }).click();
  const icon = page.locator("article", { has: page.getByRole("button", { name: "Abrir Anatomía" }) }).locator("[class*=iconWell]");
  await expect(icon).toHaveCSS("color", "rgb(196, 94, 75)");
  await page.reload();
  await expect(icon).toHaveCSS("color", "rgb(196, 94, 75)");
});
test("large levels scroll inside a horizontal map on desktop and mobile", async ({ page }) => {
  await page.goto(`${root}?estado=large`);
  const cards = page.locator(".react-flow__node article[data-kind]");
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeLessThan(200);
  const canvas = page.getByRole("region", { name: "Mapa del nivel Mi mapa de aprendizaje" });
  const before = await canvas.evaluate((element) => element.scrollTop);
  await canvas.hover();
  await page.mouse.wheel(0, 400);
  await expect.poll(() => canvas.evaluate((element) => element.scrollTop)).toBeGreaterThan(before);
  expect(new URL(page.url()).searchParams.has("node")).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("one level at a time keeps its incoming line and a centered origin", async ({ page }) => {
  await page.goto(root);
  await expect(page.locator(".react-flow__node-origin")).toHaveCount(1);
  await expect(page.locator(".react-flow__edge-connection")).toHaveCount(6);
  await expect(page.getByLabel("Conexión con el nivel anterior")).toHaveCount(0);
  await page.getByRole("button", { name: "Abrir Anatomía", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Anatomía", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Abrir Bioquímica", exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Conexión con el nivel anterior")).toHaveCount(1);
  const animation = page.waitForFunction(() => {
    const line = document.querySelector('[data-phase="entering"][data-direction="forward"] .react-flow__edge-path');
    return line && getComputedStyle(line).animationName.includes("diagram-line-draw");
  });
  await page.getByRole("button", { name: "Abrir Tórax", exact: true }).click();
  await animation;
  await expect(page.getByRole("heading", { name: "Tórax", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Abrir Abdomen", exact: true })).toHaveCount(0);
  await expect(page.locator(".react-flow__edge-connection path[pathLength='1']")).toHaveCount(8);
  await expect(page.locator('[data-phase="idle"]')).toBeVisible();
  const source = await page.locator(".react-flow__node-origin").boundingBox();
  const boxes = await Promise.all((await page.locator(".react-flow__node article").all()).map((card) => card.boundingBox()));
  expect(Math.abs(source!.y + source!.height / 2 - (boxes[0]!.y + boxes.at(-1)!.y + boxes.at(-1)!.height) / 2)).toBeLessThan(2);
  expect(boxes.every((box) => box!.x > source!.x + source!.width)).toBe(true);
  expect(await page.locator(".react-flow__edge path[marker-end]").count()).toBe(0);
  await page.getByRole("button", { name: "Volver desde Tórax", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Anatomía", exact: true })).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Atrás en el mapa" }).click();
  await page.getByRole("button", { name: "Abrir Anatomía", exact: true }).click();
  await expect(page.locator('[data-phase="idle"]')).toBeVisible();
});

test("horizontal branches meet the source and card sides after resizing, scrolling and zoom", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${root}?node=${node}&item=${block}`);
  await expect(page.locator('[data-phase="idle"]')).toBeVisible();
  const checkEndpoints = async () => {
    await expect.poll(() => page.locator(".react-flow__edge-connection path").evaluateAll((paths) => {
      const cards = Array.from(document.querySelectorAll(".react-flow__node article"));
      const source = document.querySelector(".react-flow__node-origin")!.getBoundingClientRect();
      if (paths.length !== cards.length || !paths.length) return Infinity;
      return Math.max(...paths.flatMap((element, index) => {
        const path = element as SVGPathElement;
        const matrix = path.getScreenCTM();
        if (!matrix) return [Infinity];
        const start = path.getPointAtLength(0).matrixTransform(matrix);
        const end = path.getPointAtLength(path.getTotalLength()).matrixTransform(matrix);
        const target = cards[index]!.getBoundingClientRect();
        return [Math.abs(start.x - source.right), Math.abs(start.y - (source.top + source.height / 2)),
          Math.abs(end.x - target.left), Math.abs(end.y - (target.top + target.height / 2))];
      }));
    })).toBeLessThanOrEqual(3);
  };
  for (const width of [320, 390, 540, 767, 1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await checkEndpoints();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole("button", { name: "Acercar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Restablecer zoom al 100 %" })).toContainText("110");
  await checkEndpoints();
  const canvas = page.getByRole("region", { name: "Mapa del nivel Tórax" });
  await canvas.evaluate((element) => { element.scrollTop = 130; });
  await checkEndpoints();
  await page.getByRole("button", { name: "Ajustar vista", exact: true }).click();
  await expect(page.getByRole("button", { name: "Restablecer zoom al 100 %" })).toContainText("100");
  await checkEndpoints();
  await page.screenshot({ path: testInfo.outputPath("horizontal-connections.png"), fullPage: true });
});
test("slow level navigation responds immediately and completes the diagram transition", async ({ page }) => {
  await page.goto(`${root}?estado=slow`);
  await expect(page.getByRole("button", { name: "Abrir Anatomía" })).toBeVisible();
  const leaving = page.waitForFunction(() => document.querySelector('[data-phase="leaving"]'));
  await page.getByRole("button", { name: "Abrir Anatomía" }).click();
  await leaving;
  await expect(page).toHaveURL(/node=/);
  await expect(page.getByRole("heading", { name: "Anatomía", exact: true })).toBeVisible();
  await expect(page.locator('[data-phase="idle"]')).toBeVisible();
});
test("opening unit activities leaves the map still", async ({ page }) => {
  await page.goto(`${root}?node=${node}&item=${block}`);
  await expect(page.getByRole("button", { name: "Abrir Corazón", exact: true })).toBeVisible();
  await expect(page.locator('[data-phase="idle"]')).toBeVisible();
  await page.getByRole("button", { name: "Abrir Corazón", exact: true }).click();
  await expect(page.getByRole("button", { name: "Cerrar lección" })).toBeVisible();
  await expect(page.locator('[data-phase="idle"]')).toBeVisible();
  await page.getByRole("button", { name: "Cerrar lección" }).click();
  await expect(page.locator('[data-phase="idle"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Abrir Corazón", exact: true })).toBeVisible();
});
test("six visual states and responsive widths remain readable", async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  for (const [name, query] of Object.entries({
    root: "",
    node: `node=${node}`,
    block: `node=${node}&item=${block}`,
    lesson: `node=${node}&item=${block}&unit=leccion-2`,
    direct: "node=b1000000-0000-4000-8000-000000000003",
    mixed: `estado=mixed&node=${node}`,
  })) {
    await page.goto(`${root}?${query}`);
    await expect(
      page.getByRole("button", {
        name: "Vista de lista",
        exact: true,
        includeHidden: true,
      }),
    ).toBeVisible();
    await expect(page.locator(".app-topbar")).toBeVisible();
    await expect(page.locator(".app-sidebar")).toBeAttached();
    await expect(page.getByText("Posiciones guardadas", { exact: true })).toHaveCount(0);
    await expect(page.locator(".react-flow__node").first()).toBeAttached();
    await page.screenshot({
      path: testInfo.outputPath(`${name}.png`),
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${root}?estado=long`);
    await expect(page.locator(".react-flow__node").first()).toBeVisible();
    const cards = await page
      .locator(".react-flow__node article")
      .evaluateAll((elements) =>
        elements.map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            x: rect.x,
            y: rect.y,
            right: rect.right,
            bottom: rect.bottom,
            height: rect.height,
          };
        }),
      );
    expect(new Set(cards.map((card) => Math.round(card.height))).size).toBe(1);
    for (let i = 0; i < cards.length; i++)
      for (let j = i + 1; j < cards.length; j++) {
        const a = cards[i]!,
          b = cards[j]!;
        expect(
          a.x < b.right && b.x < a.right && a.y < b.bottom && b.y < a.bottom,
        ).toBe(false);
      }
    await page.screenshot({
      path: testInfo.outputPath(`long-canvas-${width}.png`),
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Vista de lista", exact: true })
      .click();
    const contentFits = await page.locator("article").evaluateAll((elements) =>
      elements.every((el) => {
        const card = el.getBoundingClientRect();
        const button = el
          .querySelector("button[data-map-open]")!
          .getBoundingClientRect();
        return button.bottom <= card.bottom + 1;
      }),
    );
    expect(contentFits).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`long-${width}.png`),
      fullPage: true,
    });
  }
});
test("hierarchy, deep links, back/forward and lesson panel", async ({
  page,
  isMobile,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(root);
  if (isMobile)
    await page
      .getByRole("button", { name: "Vista de lista", exact: true })
      .click();
  await expect(
    page.getByRole("button", { name: "Abrir Anatomía", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Abrir Anatomía", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Anatomía", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Abrir Tórax", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Tórax", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Abrir Corazón", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Corazón", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("13 % · 1/8 esenciales", { exact: false }),
  ).toBeVisible();
  if (!isMobile) {
    await expect(page.getByRole("button", { name: "Cerrar lección" })).toBeVisible();
  }
  await page.screenshot({
    path: testInfo.outputPath("lesson.png"),
    fullPage: true,
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Corazón", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Cerrar lección", exact: true })
    .click();
  await expect(page).not.toHaveURL(/unit=/);
  await page
    .getByRole("button", { name: "Atrás en el mapa", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Anatomía", exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Tórax", exact: true }),
  ).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole("heading", { name: "Anatomía", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("icon-only list control aligns right and list reflows", async ({
  page,
}, testInfo) => {
  await page.goto(`${root}?node=${node}&item=${block}`);
  await expect(page.getByRole("button", { name: "Abrir Corazón", exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Vista de lista", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Abrir Corazón", exact: true }),
  ).toBeVisible();
  const list = page.getByRole("button", { name: "Vista de mapa" });
  await expect(list).toBeVisible();
  await expect(list).toHaveText("");
  const header = await page.locator("header").filter({ has: list }).boundingBox();
  const listBox = await list.boundingBox();
  expect(listBox!.x).toBeGreaterThan(header!.x + header!.width / 2);
  expect(listBox!.x + listBox!.width).toBeGreaterThan(header!.x + header!.width - 32);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("list.png"),
    fullPage: true,
  });
});
test("manual zoom keeps hierarchy and reduced motion stays usable", async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(root);
  await expect(page.getByRole("button", { name: "Abrir Anatomía", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Restablecer zoom al 100 %" }).click();
  await expect(
    page.getByRole("button", { name: "Restablecer zoom al 100 %" }),
  ).toContainText("100");
  await page.getByRole("button", { name: "Acercar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Restablecer zoom al 100 %" }),
  ).toContainText("110");
  expect(new URL(page.url()).searchParams.has("node")).toBe(false);
  if (isMobile) await page.getByRole("button", { name: "Vista de lista", exact: true }).click();
  await page.getByRole("button", { name: "Abrir Anatomía", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Anatomía", exact: true }),
  ).toBeVisible();
});
