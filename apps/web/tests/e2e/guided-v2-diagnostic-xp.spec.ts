import { test, expect } from "@playwright/test";
import type { V2AttemptManifest } from "@cediah/contracts";

for (const passed of [true, false]) test(`XP enable a diagnostic; ${passed ? "passing opens the chosen objective" : "failing preserves prerequisites"}`, async ({ page: initialPage, context, request }, info) => {
  let page = initialPage;
  const actor = `xp-${passed ? "success" : "failure"}${info.project.name === "mobile" ? "-mobile" : ""}`;
  await page.context().addCookies([{ name: "t035", value: actor, domain: "127.0.0.1", path: "/" }]);
  const ready = await (await request.get("http://127.0.0.1:41035/__test/ready")).json();
  await page.goto("/aprendizaje/rutas/xp-admission");
  const begin = page.getByRole("button", { name: "Comenzar", exact: true });
  await expect(begin).toBeVisible();
  await expect.poll(() => begin.evaluate(element => Object.keys(element).some(key => key.startsWith("__reactProps")
    && typeof (element as unknown as Record<string, { onClick?: unknown }>)[key]?.onClick === "function"))).toBe(true);
  const enrollment = page.waitForResponse(response => response.request().method() === "POST" && new URL(response.url()).pathname === "/api/v2/guided-learning/enrollments");
  await begin.click();
  expect((await enrollment).status()).toBe(200);
  const points = page.getByRole("region", { name: "Puntos de aprendizaje" });
  await expect(points.getByText("50 XP", { exact: true })).toBeVisible();
  const objective = page.getByRole("region", { name: "Objetivo: Aplicar el ejemplo 2", exact: true });
  const diagnostic = objective.getByRole("button", { name: "Hacer diagnóstico para avanzar", exact: true });
  {
    const creation = page.waitForResponse(response => response.request().method() === "POST" && new URL(response.url()).pathname === "/api/v2/guided-learning/attempts");
    await diagnostic.click();
    let attempt: V2AttemptManifest = (await (await creation).json()).attempt;
    await expect(page.getByRole("heading", { name: "Diagnóstico para avanzar", exact: true })).toBeVisible();
    let answered = 0;
    while (attempt.activeActivity) {
      const activity = attempt.activeActivity;
      await expect(page.getByRole("heading", { name: activity.prompt, exact: true })).toBeVisible();
      if (activity.kind === "single_choice") await page.getByRole("radio", { name: !passed && answered === 0 ? "Respuesta B" : "Respuesta A", exact: true }).check();
      else if (activity.kind === "match") await page.getByRole("combobox", { name: "Origen", exact: true }).selectOption("c");
      else if (activity.kind === "short_answer") await page.getByRole("textbox", { name: "Tu respuesta", exact: true }).fill("respuesta");
      else throw new Error(`Unexpected fixture activity: ${activity.kind}`);
      const path = `/api/v2/guided-learning/attempts/${attempt.attemptId}/responses`;
      const submit = page.getByRole("button", { name: activity.kind === "match" ? "Comprobar relaciones" : "Comprobar respuesta", exact: true });
      await expect(page.getByText(`Pregunta ${answered + 1} del diagnóstico`, { exact: true })).toBeVisible();
      let originalKey: string | undefined;
      let originalBody: string | null = null;
      let committedReceipt;
      // Leave the stalled tab open while its peer recovers the same last answer.
      const firstTab = page;
      if (answered === 2) {
        await page.route(`**${path}`, async route => {
          originalKey = route.request().headers()["idempotency-key"];
          originalBody = route.request().postData();
          if (passed) {
            const committed = await route.fetch();
            expect(committed.status()).toBe(200);
            committedReceipt = await committed.json();
          }
          await route.abort();
        });
        await submit.click();
        const retry = { name: "Reintentar solicitud pendiente", exact: true };
        await expect(page.getByRole("button", retry)).toBeVisible();
        await page.reload();
        await expect(page.getByRole("button", retry)).toBeVisible();
        const sessionUrl = page.url();
        const otherTab = await context.newPage();
        page = otherTab;
        await page.goto(sessionUrl);
        await expect(page.getByRole("button", retry)).toBeVisible();
        const before = await (await request.get(`http://127.0.0.1:41035/__test/responses/${attempt.attemptId}`)).json();
        expect(before.rows).toHaveLength(passed ? 3 : 2);
      }
      const receipt = page.waitForResponse(response => response.request().method() === "POST" && new URL(response.url()).pathname === path);
      if (answered === 2) await page.getByRole("button", { name: "Reintentar solicitud pendiente", exact: true }).click();
      else await submit.click();
      const response = await receipt;
      expect(response.status()).toBe(200);
      const result = await response.json();
      if (answered === 2) {
        expect(originalKey).toBeTruthy();
        expect(response.request().headers()["idempotency-key"]).toBe(originalKey);
        expect(response.request().postData()).toBe(originalBody);
        if (passed) expect(result).toEqual(committedReceipt);
        const after = await (await request.get(`http://127.0.0.1:41035/__test/responses/${attempt.attemptId}`)).json();
        expect(after.rows).toHaveLength(3);
        await firstTab.unroute(`**${path}`);
        const replay = firstTab.waitForResponse(response => response.request().method() === "POST" && new URL(response.url()).pathname === path);
        await firstTab.getByRole("button", { name: "Reintentar solicitud pendiente" }).click();
        const same = await replay;
        expect(same.request().headers()["idempotency-key"]).toBe(originalKey);
        expect(await same.json()).toEqual(result);
        await firstTab.close();
      }
      expect(result.feedback.score01).toBeNull();
      expect(result.feedback.explanation).toBe("");
      attempt = result.attempt;
      answered++;
      await expect(page.getByRole("heading", { name: "Respuesta correcta", exact: true })).not.toBeVisible();
    }
    expect(answered).toBe(3);
    await page.getByRole("button", { name: "Finalizar sesión", exact: true }).click();
    await expect(page.getByRole("heading", { name: passed ? "Puedes avanzar a tu objetivo" : "Refuerza los conocimientos previos", exact: true })).toBeVisible();
    await expect(page.getByText("Ganaste 0 XP · Total: 50 XP", { exact: true })).toBeVisible();
    await page.getByText("Respuestas confirmadas", { exact: true }).click();
    await expect(page.getByRole("heading", { name: `Pregunta 1 · ${passed ? "Correcta" : "Por reforzar"}` })).toBeVisible();
    if (passed) {
      await page.getByRole("button", { name: "Siguiente actividad", exact: true }).click();
      await expect(page.getByRole("heading", { name: "study-2: actividad sintética", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Guardar lectura", exact: true }).click();
      await page.getByRole("button", { name: "Finalizar sesión", exact: true }).click();
    }
    await page.goto("/aprendizaje/rutas/xp-admission");
  }
  const path = await (await page.request.get("/api/v2/guided-learning/paths/xp-admission")).json();
  expect(path.path.pathId).toBe(ready.fixtures.admission.pathId);
  const state = (await (await page.request.get(`/api/v2/guided-learning/enrollments/${path.path.enrollmentId}/state`)).json()).state;
  expect(state.masteredAt).toBeNull(); expect(state.consolidatedAt).toBeNull();
  expect(state.objectives.every((item: { objectiveScore: number | null }) => item.objectiveScore === null)).toBe(true);
  expect(state.motivation.totalXp).toBe(50);
  expect(state.completedActivities).toBe(passed ? 1 : 0);
  expect(state.maintenance.blockers.some((item: { objectiveKey: string }) => item.objectiveKey === "objective-2")).toBe(!passed);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test("version adoption recovers a committed receipt after reload and preserves the enrollment history", async ({ page }, info) => {
  const actor = info.project.name === "mobile" ? "student-40" : "student-39";
  await page.context().addCookies([{ name: "t035", value: actor, domain: "127.0.0.1", path: "/" }]);
  await page.goto("/aprendizaje/rutas/f02-versiones");
  const { path } = await (await page.request.get("/api/v2/guided-learning/paths/f02-versiones")).json();
  const url = `/api/v2/guided-learning/enrollments/${path.enrollmentId}`;
  const state = async () => (await (await page.request.get(`${url}/state`)).json()).state;
  const before = await state();
  const versions = page.getByText("Versiones e historial", { exact: true });
  await versions.click();
  await page.getByRole("button", { name: "Revisar actualización" }).click();
  const adopt = page.getByRole("button", { name: "Adoptar versión" });
  await expect(adopt).toBeDisabled();
  expect((await state()).pathVersionId).toBe(before.pathVersionId);
  await page.getByRole("checkbox", { name: /Entiendo qué evidencia/ }).check();
  let originalKey: string | undefined;
  let originalBody: string | null = null;
  let committed: unknown;
  await page.route(`**${url}/upgrade`, async route => {
    originalKey = route.request().headers()["idempotency-key"];
    originalBody = route.request().postData();
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    committed = await response.json();
    await route.abort();
  });
  await adopt.click();
  const retry = page.getByRole("button", { name: "Recuperar actualización pendiente" });
  await expect(retry).toBeVisible();
  const after = await state();
  expect(after.pathVersionId).not.toBe(before.pathVersionId);
  expect(after.versionHistory).toHaveLength(before.versionHistory.length + 1);
  expect(after.motivation.totalXp).toBe(before.motivation.totalXp);
  await page.unroute(`**${url}/upgrade`);
  await page.reload();
  await versions.click();
  await expect(retry).toBeVisible();
  const replay = page.waitForResponse(response => response.request().method() === "POST" && new URL(response.url()).pathname === url + "/upgrade");
  await retry.click();
  const response = await replay;
  expect(originalKey).toBeTruthy();
  expect(response.request().headers()["idempotency-key"]).toBe(originalKey);
  expect(response.request().postData()).toBe(originalBody);
  expect(await response.json()).toEqual(committed);
  await expect(page.getByText("Actualización confirmada. Ya estás en la versión elegida.")).toBeVisible();
  await expect(retry).toHaveCount(0);
  expect(await state()).toEqual(after);
});

for (const afterCommit of [false, true]) test(`final V1 review recovers ${afterCommit ? "after" : "before"} commit in a second tab`, async ({ page, context, request }, info) => {
  const actor = `xp-${afterCommit ? "success" : "failure"}${info.project.name === "mobile" ? "-mobile" : ""}`;
  await context.addCookies([{ name: "t035", value: actor, domain: "127.0.0.1", path: "/" }]);
  const ledger = async () => (await request.get(`http://127.0.0.1:41035/__test/review/${actor}`)).json();
  const baseline = await ledger();
  const url = `/aprendizaje/sesiones/${baseline.attemptId}`;
  const path = `**/api/guided-learning/attempts/${baseline.attemptId}/responses`;
  await page.goto(url);
  await page.getByRole("radio", { name: afterCommit ? "Letra A" : "Letra C" }).check();
  let originalBody: string | null = null, originalKey: string | undefined;
  let originalReceipt: unknown;
  await page.route(path, async route => {
    const first = !originalKey;
    if (first) {
      originalBody = route.request().postData();
      originalKey = route.request().headers()["idempotency-key"];
    } else {
      expect(route.request().postData()).toBe(originalBody);
      expect(route.request().headers()["idempotency-key"]).toBe(originalKey);
    }
    if (first && !afterCommit) return route.fulfill({ status: 401, json: { error: "unauthorized" } });
    if (afterCommit && !originalReceipt) {
      const response = await route.fetch();
      expect(response.status()).toBe(200);
      originalReceipt = await response.json();
    }
    await route.abort();
  });
  await page.getByRole("button", { name: "Comprobar", exact: true }).click();
  const pending = page.getByRole("button", { name: "Reintentar envío pendiente" });
  await expect(pending).toBeVisible();
  if (!afterCommit) await expect(page.getByRole("link", { name: "Iniciar sesión", exact: true }))
    .toHaveAttribute("href", `/acceder?${new URLSearchParams({ next: url })}`);
  await page.reload();
  await expect(pending).toBeVisible();
  const interrupted = await ledger();
  expect(interrupted.responses).toBe(afterCommit ? 1 : 0);
  if (!afterCommit) expect(interrupted).toEqual(baseline);
  if (!afterCommit) {
    for (const [fault, reason] of [
      ["service", "El servicio de acceso está"],
      ["invalid", "Recibimos datos de sesión"],
      ["timeout", "El servidor tardó demasiado"],
    ] as const) {
      await context.addCookies([{ name: "f02_access", value: fault, domain: "127.0.0.1", path: "/" }]);
      await page.reload();
      await expect(page.getByRole("heading", { name: "No pudimos verificar tu sesión" })).toBeVisible();
      await expect(page.getByText(reason, { exact: false })).toBeVisible();
      await page.getByText("Detalles del problema").click();
      await expect(page.getByText(/^Referencia: [\w-]+$/)).toBeVisible();
      expect(new URL(page.url()).pathname).toBe(url);
      expect(await ledger()).toEqual(baseline);
    }
    await context.clearCookies({ name: "f02_access" });
    await context.clearCookies({ name: "t035" });
    await page.reload();
    await expect(page).toHaveURL(/\/acceder\?error=sesion/);
    await context.addCookies([{ name: "t035", value: actor, domain: "127.0.0.1", path: "/" }]);
  }
  const other = await context.newPage();
  await page.close();
  const recovery = other.waitForResponse(path);
  await other.goto(url);
  const response = await recovery;
  expect(response.status()).toBe(200);
  expect(originalKey).toBeTruthy();
  expect(response.request().headers()["idempotency-key"]).toBe(originalKey);
  expect(response.request().postData()).toBe(originalBody);
  const receipt = await response.json();
  if (afterCommit) expect(receipt).toEqual(originalReceipt);
  expect(receipt.feedback.grading.correct).toBe(afterCommit);
  expect(receipt.progress).toBeNull();
  await other.getByRole("button", { name: "Ver resumen" }).click();
  await expect(other.getByRole("heading", { name: "Repaso completado" })).toBeVisible();
  const final = await ledger();
  expect(final.responses).toBe(1);
  expect(final.version).toBe(baseline.version + 1);
  expect(final.xp).toBe(baseline.xp + receipt.awards.reduce((sum: number, award: { xp: number }) => sum + award.xp, 0));
  if (afterCommit) expect(final).toEqual(interrupted);
  await other.reload();
  await expect(other.getByRole("heading", { name: "Repaso completado" })).toBeVisible();
  expect(await ledger()).toEqual(final);
});
