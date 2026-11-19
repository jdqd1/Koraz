import { test, expect, type Page, type Locator } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import type { V2AnswerSchema } from "@cediah/contracts";
import type { z } from "zod";
import { installBrowserTiming, measureClick, type BrowserTiming } from "./learning-browser-timing";

const api = "http://127.0.0.1:41035";
const route = "/aprendizaje/rutas/t035-small?leccion=unit";
let V2HttpContracts: typeof import("@cediah/contracts")["V2HttpContracts"];
test.beforeAll(async () => { ({ V2HttpContracts } = await import("@cediah/contracts")); });
async function interactive(control: Locator) {
  await expect(control).toBeEnabled();
  await expect.poll(() => control.evaluate(el => Object.entries(el).some(([key, props]) =>
    key.startsWith("__reactProps") && typeof (props as { onClick?: unknown })?.onClick === "function"))).toBe(true);
}
async function post(page: Page, path: string, data: unknown) {
  const response = await page.request.post(`${api}/v2/guided-learning/${path}`, { data, headers: { "idempotency-key": crypto.randomUUID() } });
  expect(response.status(), await response.text()).toBe(200);
  return response.json();
}

/** Establish identical prerequisites through public commands, outside measured UI interactions. */
async function prepareChoice(page: Page, pathId: string) {
  let { state } = V2HttpContracts.enrollmentCreate.response.parse(await post(page, "enrollments", { pathId }));
  for (const key of ["study-1", "constructed-1"]) {
    let { attempt } = V2HttpContracts.attemptCreate.response.parse(await post(page, "attempts", {
      enrollmentId: state.enrollmentId, expectedEnrollmentVersion: state.rowVersion,
      clientAttemptId: crypto.randomUUID(), target: { kind: "activity", key },
    }));
    const respond = async (answer: z.infer<typeof V2AnswerSchema>) => {
      const result = V2HttpContracts.attemptResponse.response.parse(await post(page, `attempts/${attempt.attemptId}/responses`, {
        activityKey: key, expectedVersion: attempt.rowVersion, answer, confidence: null,
      }));
      attempt = result.attempt;
    };
    if (key === "study-1") await respond({ kind: "study", acknowledged: true });
    else {
      await respond({ kind: "constructed_response", text: "Una relación sintética.", selfRating: null });
      ({ attempt } = V2HttpContracts.attemptHelp.response.parse(await post(page, `attempts/${attempt.attemptId}/help`, {
        activityKey: key, expectedVersion: attempt.rowVersion, kind: "reveal",
      })));
      await respond({ kind: "constructed_response", text: "Una relación sintética.", selfRating: "good" });
    }
    ({ state } = V2HttpContracts.attemptComplete.response.parse(await post(page, `attempts/${attempt.attemptId}/complete`, { expectedVersion: attempt.rowVersion })));
  }
  return state;
}

test("F07 measures V2 create, resume and confirmed answer without duplicate progress", async ({ page }, info) => {
  test.setTimeout(600_000);
  await installBrowserTiming(page);
  await page.clock.setFixedTime(new Date("2026-10-04T12:00:00Z"));
  const ready = await (await page.request.get(`${api}/__test/ready`)).json();
  const samples: { mode: string; launch: BrowserTiming; resume: BrowserTiming; confirmation: BrowserTiming }[] = [];
  const sampleCount = process.env.F07_SMOKE === "true" ? 1 : 40;
  for (let index = 0; index < sampleCount; index++) {
    await page.context().addCookies([{ name: "t035", value: `f07-performance-${info.project.name}-${index}`, domain: "127.0.0.1", path: "/" }]);
    const initial = await prepareChoice(page, ready.fixtures.small.pathId);
    const mode = index < 10 ? "cold" : "warm";
    if (mode === "cold") await page.goto(route);
    else {
      await page.goto("/aprendizaje?tab=rutas");
      const link = page.getByRole("link", { name: "Abrir ruta Ruta T035 pequeña", exact: true });
      await interactive(link);
      await link.click();
    }
    const open = page.locator("#actividad-choice-1").getByRole("button", { name: "Abrir actividad", exact: true });
    await interactive(open);
    const launch = await measureClick(page, open, 'input[type="radio"]');
    const sessionUrl = page.url();
    const attemptId = new URL(sessionUrl).pathname.split("/").at(-1)!;
    const original = V2HttpContracts.attemptGet.response.parse(await (await page.request.get(`${api}/v2/guided-learning/attempts/${attemptId}`)).json());
    expect(original.attempt.acceptedResponses).toHaveLength(0);
    await page.getByRole("link", { name: "Volver a la unidad", exact: true }).first().click();
    const resumeAction = page.getByRole("region", { name: "Acción recomendada" }).getByRole("button");
    await interactive(resumeAction);
    const before = await (await page.request.get(`${api}/__test/counts`)).json();
    const resume = await measureClick(page, resumeAction, 'input[type="radio"]');
    await expect(page).toHaveURL(sessionUrl);
    expect(await (await page.request.get(`${api}/__test/counts`)).json()).toEqual(before);
    await page.getByRole("radio", { name: "Respuesta A", exact: true }).check();
    const submit = page.getByRole("button", { name: "Comprobar respuesta", exact: true });
    await expect(submit).toBeEnabled();
    const confirmation = await measureClick(page, submit, "h3", "Respuesta correcta");
    await expect(page.getByRole("heading", { name: "Respuesta correcta", exact: true })).toBeFocused();
    const persisted = V2HttpContracts.attemptGet.response.parse(await (await page.request.get(`${api}/v2/guided-learning/attempts/${attemptId}`)).json());
    expect(persisted.attempt.acceptedResponses).toHaveLength(1);
    expect(persisted.attempt.acceptedResponses[0]).toMatchObject({ activityKey: "choice-1", answer: { kind: "single_choice", optionKey: "yes" } });
    const after = await (await page.request.get(`${api}/__test/counts`)).json();
    expect(after.learning_v2_responses - before.learning_v2_responses).toBe(1);
    await page.getByRole("button", { name: /^(Continuar|Ver cierre de sesión)$/ }).click();
    const completed = page.getByRole("heading", { name: "Sesión completada", exact: true });
    const finish = page.getByRole("button", { name: "Finalizar sesión", exact: true });
    await expect(completed.or(finish).first()).toBeVisible();
    if (await finish.isVisible()) await finish.click();
    await expect(completed).toBeVisible();
    const state = V2HttpContracts.enrollmentState.response.parse(await (await page.request.get(`${api}/v2/guided-learning/enrollments/${initial.enrollmentId}/state`)).json()).state;
    expect(state.activityProgress?.find(item => item.key === "choice-1")?.status).toBe("completed");
    samples.push({ mode, launch, resume, confirmation });
    await writeFile(info.outputPath("v2-interactions.json"), JSON.stringify({ profile: info.project.name,
      browser: page.context().browser()?.version(), viewport: page.viewportSize(), samples }, null, 2));
  }
});
