import { test, expect, type Page, type TestInfo } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { V2HttpContracts, V2PublicActivitySchema, type V2AttemptManifest, type V2PublicActivity } from "@cediah/contracts";
import { studentFixture, fixtureId } from "../../src/components/learning/v2/fixtures";
import { legacyActivityFixture } from "../../src/components/learning/activities/activity-player-fixtures";
import { learningVisualProgress } from "../../src/components/learning/learning-visual-fixtures";

const source = { key: "source", title: "Fuente del ejercicio", citation: "Material sintético para verificar la interfaz.", locator: { heading: "Relaciones", sectionPath: ["Conceptos"], page: 2 }, excerpt: "A precede a B.", url: null };
const feedback = { explanation: "A precede a B: identifica primero el origen y después el resultado.", commonError: "No confundas el origen con el resultado.", sources: [source] };
const visualUrl = "https://activity-ui.example.test/figure.svg";
const figure = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360"><rect width="600" height="360" fill="#f4f7fc"/><path d="M300 70v180m0-100-100 60m100-60 110 65" fill="none" stroke="#6483ba" stroke-width="20" stroke-linecap="round"/><circle cx="300" cy="70" r="28" fill="#b4c7ea"/><text x="40" y="325" font-family="sans-serif" font-size="16" fill="#63708a">Figura de práctica</text></svg>';

function activityFor(mode: string): V2PublicActivity {
  const base = { key: "practice-a", objectiveKey: "objective-a", phase: "retrieve", representation: "text", prompt: "¿Qué concepto precede a B?" };
  const options = [{ key: "a", text: "Concepto A" }, { key: "b", text: "Concepto C" }, { key: "c", text: "Concepto D" }];
  const activity = mode === "study" || mode === "worked-example" || mode === "partial-example" ? { ...base, kind: "study", phase: "learn", prompt: "Comprende la relación entre A y B", payload: { body: "El concepto A precede a B. Primero identifica el origen y después relaciona el resultado.\n\nIntenta recuperar esta relación cuando pases a la práctica.", focusSpans: [{ start: 3, end: 26 }], assetKey: null, scaffold: mode === "worked-example" ? "worked_example" : mode === "partial-example" ? "partial_example" : "explanation", videoRange: null } }
    : mode === "short_answer" || mode === "constructed_response" ? { ...base, kind: mode, prompt: mode === "constructed_response" ? "Explica cómo se relacionan A y B" : base.prompt, payload: { maxChars: mode === "short_answer" ? 240 : 4000 } }
      : ["match", "comparison_table", "causal_map"].includes(mode) ? { ...base, kind: "match", prompt: "Relaciona cada concepto con su función", payload: { presentation: mode === "match" ? "pairs" : mode, prompts: [{ key: "p1", text: "Concepto A" }, { key: "p2", text: "Concepto B" }], choices: [{ key: "c1", text: "Origen" }, { key: "c2", text: "Resultado" }], allowReuse: false } }
        : mode === "sequence" ? { ...base, kind: "sequence", prompt: "Ordena la relación desde su origen", payload: { items: [{ key: "a", text: "Identificar el origen" }, { key: "b", text: "Reconocer el cambio" }, { key: "c", text: "Relacionar el resultado" }] } }
          : mode === "image_target" || mode === "labeling" ? { ...base, kind: "image_target", representation: "image", prompt: mode === "labeling" ? "Identifica los puntos de la imagen" : "Señala el origen en la imagen", payload: { assetKey: "figure", mode: mode === "labeling" ? "labeling" : "hotspot", masking: "no_labels", targets: [{ key: "origin", prompt: "Origen", marker: mode === "labeling" ? { x: .5, y: .2 } : null }], labels: mode === "labeling" ? [{ key: "a", text: "Origen" }, { key: "b", text: "Resultado" }] : [] } }
            : mode === "case-wrapper" ? { ...base, kind: "case", prompt: "Caso progresivo", payload: { activeStage: { key: "stage-a", narrative: "Un cambio en A modifica el resultado B.", childActivityKey: "child-a" } } }
              : { ...base, kind: "single_choice", ...(mode === "case" ? { representation: "case", prompt: "Un cambio en A modifica el resultado B. Observa la relación antes de responder.\n\n¿Qué concepto inicia este cambio?" } : {}), payload: { options } };
  return V2PublicActivitySchema.parse(activity);
}

async function mockPlayer(page: Page, mode: string, failFirst = false) {
  const fixture = studentFixture();
  let attempt: V2AttemptManifest = { ...fixture.attempt, activeActivity: activityFor(mode) };
  let state = fixture.state;
  const writes: { url: string; body: unknown; key: string | undefined }[] = [];
  // Permit only this synthetic media origin in the fixture document. Runtime CSP stays unchanged.
  await page.route("**/visual-fixtures/aprendizaje-v2?**", async route => {
    if (route.request().resourceType() !== "document") return route.continue();
    const response = await route.fetch(), headers = response.headers();
    if (headers["content-security-policy"]) headers["content-security-policy"] = headers["content-security-policy"].replace("img-src 'self'", "img-src 'self' https://activity-ui.example.test");
    await route.fulfill({ response, headers });
  });
  await page.route(visualUrl, route => route.fulfill({ contentType: "image/svg+xml", body: figure }));
  await page.route("**/api/v2/guided-learning/**", async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname;
    if (request.method() === "GET") {
      if (path.endsWith("/image")) return route.fulfill({ json: V2HttpContracts.attemptImage.response.parse({ activityKey: attempt.activeActivity!.key, attemptVersion: attempt.rowVersion, image: { assetKey: "figure", url: visualUrl, alt: "Figura sintética de origen y ramas", expiresAt: "2035-01-01T00:00:00Z" } }) });
      return route.fulfill({ json: path.endsWith("/state") ? { state } : { attempt } });
    }
    const body = request.postDataJSON();
    writes.push({ url: path, body, key: request.headers()["idempotency-key"] });
    if (path.endsWith("/responses") && failFirst) { failFirst = false; return route.abort("failed"); }
    if (path.endsWith("/help")) {
      const parsed = V2HttpContracts.attemptHelp.body.parse(body);
      attempt = { ...attempt, rowVersion: attempt.rowVersion + 1 };
      if (parsed.kind === "reveal" && attempt.constructedResponse) attempt.constructedResponse = { ...attempt.constructedResponse, stage: "revealed", modelAnswer: "A precede a B.", rubric: [{ key: "origin", criterion: "Identifica el origen", example: "Reconoce A antes de relacionar B." }] };
      return route.fulfill({ json: V2HttpContracts.attemptHelp.response.parse({ attempt, help: { kind: parsed.kind, text: "Identifica el origen antes de relacionar el resultado." } }) });
    }
    if (path.endsWith("/responses")) {
      const parsed = V2HttpContracts.attemptResponse.body.parse(body);
      const accepted = parsed.answer.kind !== "constructed_response" || parsed.answer.selfRating !== null;
      const score01 = parsed.answer.kind === "study" || parsed.answer.kind === "constructed_response" ? null : 1;
      attempt = { ...attempt, rowVersion: attempt.rowVersion + 1 };
      if (!accepted && parsed.answer.kind === "constructed_response") attempt.constructedResponse = { activityKey: parsed.activityKey, text: parsed.answer.text, stage: "submitted" };
      if (accepted) {
        attempt = { ...attempt, activeActivity: null, constructedResponse: undefined, acceptedResponses: [...attempt.acceptedResponses, { activityKey: parsed.activityKey, answer: parsed.answer, serverAcceptedAt: "2026-10-12T12:00:00Z", score01, feedback }] };
        state = { ...state, rowVersion: state.rowVersion + 1, completedActivities: 3 };
      }
      return route.fulfill({ json: V2HttpContracts.attemptResponse.response.parse({ accepted, attempt, state, nextStep: attempt.activeActivity, feedback: { ...feedback, score01 } }) });
    }
    if (path.endsWith("/complete")) {
      V2HttpContracts.attemptComplete.body.parse(body);
      attempt = { ...attempt, status: "completed", rowVersion: attempt.rowVersion + 1 };
      state = { ...state, rowVersion: state.rowVersion + 1, nextAction: { kind: "activity", key: "practice-b", reason: "Continúa con el siguiente concepto." } };
      return route.fulfill({ json: V2HttpContracts.attemptComplete.response.parse({ attempt, state }) });
    }
    if (path.endsWith("/attempts")) {
      V2HttpContracts.attemptCreate.body.parse(body);
      return route.fulfill({ json: V2HttpContracts.attemptCreate.response.parse({ attempt: { ...attempt, attemptId: fixtureId(5), rowVersion: 1, status: "open", activeActivity: { ...activityFor("short_answer"), key: "practice-b" }, acceptedResponses: [] } }) });
    }
    return route.fulfill({ status: 404, json: { error: "unknown fixture request" } });
  });
  return writes;
}

async function capture(page: Page, info: TestInfo, name: string) {
  const geometry = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width + 1);
  const scan = await new AxeBuilder({ page }).include('[aria-label="Sesión de aprendizaje"]').disableRules(["landmark-one-main", "region"]).analyze();
  expect(scan.violations.filter(item => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
  await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true, animations: "disabled", scale: "css", style: "nextjs-portal { visibility: hidden !important; }" });
}

for (const mode of ["study", "worked-example", "partial-example", "single_choice", "short_answer", "constructed_response", "match", "comparison_table", "causal_map", "sequence", "image_target", "labeling", "case", "case-wrapper"]) {
  test(`v2 ${mode} stays focused, responds and keeps system details on demand`, async ({ page }, info) => {
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    await mockPlayer(page, mode);
    await page.goto(`/visual-fixtures/aprendizaje-v2?surface=player&estado=${mode}`);
    await expect(page.getByRole("heading", { name: "Tu sesión de aprendizaje" })).toBeVisible();
    await expect(page.getByText("Dominio por comprobar", { exact: true })).toBeHidden();
    await page.getByRole("button", { name: "Detalles de la sesión" }).click();
    await expect(page.getByText("Dominio por comprobar", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Detalles de la sesión" }).click();
    if (mode === "image_target" || mode === "labeling") await expect(page.getByRole("img", { name: "Figura sintética de origen y ramas" })).toBeVisible();
    await capture(page, info, mode);
    if (mode === "case-wrapper") { await expect(page.getByText(/Recarga para continuar/)).toBeVisible(); return; }
    if (mode.includes("example") || mode === "study") await page.getByRole("button", { name: "Continuar a la práctica" }).click();
    else {
      if (mode === "single_choice" || mode === "case") await page.getByRole("radio").first().check();
      if (mode === "short_answer") await page.getByLabel("Tu respuesta", { exact: true }).fill("A");
      if (mode === "constructed_response") {
        await page.getByLabel("Explica con tus palabras").fill("A precede a B.");
        await page.getByRole("button", { name: "Guardar mi respuesta" }).click();
        await expect(page.getByRole("heading", { name: "Respuesta modelo" })).toHaveCount(0);
        await page.getByRole("button", { name: "Comparar con el modelo" }).click();
        await capture(page, info, "comparison");
        await page.getByRole("button", { name: "Lo recuperé", exact: true }).click();
      }
      if (["match", "comparison_table", "causal_map"].includes(mode)) {
        await page.getByRole("combobox", { name: "Concepto A", exact: true }).selectOption("c1"); await page.getByRole("combobox", { name: "Concepto B", exact: true }).selectOption("c2");
      }
      if (mode === "sequence") {
        await page.getByRole("button", { name: "Bajar: Identificar el origen", exact: true }).click();
        await expect(page.locator("ol > li").first()).toContainText("Reconocer el cambio");
        await page.getByRole("button", { name: "Necesito ayuda", exact: true }).click();
        await expect(page.getByRole("heading", { name: "Pista", exact: true })).toBeVisible();
        await expect(page.locator("ol > li").first()).toContainText("Reconocer el cambio");
        await page.getByRole("button", { name: "Ocultar ayuda", exact: true }).click();
        await page.getByRole("button", { name: "Subir: Identificar el origen", exact: true }).click();
      }
      if (mode === "image_target") await page.getByRole("group", { name: "Imagen para responder" }).click();
      if (mode === "labeling") await page.getByLabel("Punto 1: Origen").selectOption("a");
      if (mode !== "constructed_response") await page.getByRole("button", { name: /^Comprobar/ }).click();
      await expect(page.getByRole("heading", { name: mode === "constructed_response" ? "Práctica registrada" : "Respuesta correcta", exact: true })).toBeVisible();
      await expect(page.getByText(source.citation, { exact: true })).toBeHidden();
      if (mode === "short_answer") await capture(page, info, "feedback");
      await page.getByRole("button", { name: "Continuar", exact: true }).click();
    }
    const finish = page.getByRole("button", { name: "Finalizar sesión", exact: true });
    if (await finish.isVisible()) await finish.click();
    await expect(page.getByRole("heading", { name: "Sesión completada", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Siguiente actividad", exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("lost writes retry once with the same identity; next activity starts directly and preserves map exit", async ({ page }, info) => {
  const writes = await mockPlayer(page, "short_answer", true);
  await page.goto("/visual-fixtures/aprendizaje-v2?surface=player&estado=short_answer");
  await page.getByLabel("Tu respuesta", { exact: true }).fill("A");
  await page.getByRole("button", { name: "Necesito ayuda", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Pista", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ocultar ayuda", exact: true }).click();
  await page.getByRole("button", { name: "Comprobar respuesta", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reintentar solicitud pendiente" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Comprobar respuesta", exact: true })).toBeDisabled();
  await capture(page, info, "connection-error");
  await page.getByRole("button", { name: "Reintentar solicitud pendiente" }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sesión completada", exact: true })).toBeVisible();
  const responses = writes.filter(write => write.url.endsWith("/responses"));
  expect(responses).toHaveLength(2); expect(responses[0]).toEqual(responses[1]);
  await page.route(`**/aprendizaje/sesiones/${fixtureId(5)}?*`, route => route.fulfill({ contentType: "text/html", body: "<main>Siguiente sesión confirmada</main>" }));
  await page.getByRole("button", { name: "Siguiente actividad", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/aprendizaje/sesiones/${fixtureId(5)}\\?returnTo=`));
  const launch = writes.find(write => write.url.endsWith("/attempts"));
  expect(launch?.body).toMatchObject({ enrollmentId: fixtureId(3), target: { kind: "activity", key: "practice-b" } });
  expect(new URL(page.url()).searchParams.get("returnTo")).toBe("/aprendizaje/mapa");
});

for (const mode of ["quiz", "flashcards", "guide", "review", "review-card", "video", "external-video"]) {
  test(`legacy ${mode} uses the same mobile activity surface`, async ({ page }, info) => {
    let attempt = legacyActivityFixture(mode);
    await page.route("**/api/guided-learning/attempts/**", async route => {
      if (route.request().method() === "GET") return route.fulfill({ status: 403, json: { error: "fixture has no real media" } });
      const body = route.request().postDataJSON();
      const reveal = route.request().url().endsWith("/reveal");
      attempt = { ...attempt, rowVersion: attempt.rowVersion + 1, ...(reveal ? { revealedCards: [{ itemId: body.itemId ?? (attempt.manifest.projection === "flashcards" ? attempt.manifest.cards[0]!.itemId : attempt.manifest.projection === "review" ? attempt.manifest.items[0]!.itemId : attempt.id), back: "A precede a B." }] } : { status: "completed", submittedAt: "2026-10-12T12:00:00Z" }) };
      return route.fulfill({ json: { attempt, awards: [], feedback: null, progress: learningVisualProgress, saved: true } });
    });
    await page.goto(`/visual-fixtures/aprendizaje-v2?surface=legacy-player&estado=${mode}`);
    await expect(page.getByRole("heading", { name: /Práctica de conceptos|Repaso de conceptos/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await capture(page, info, mode);
    if (mode === "flashcards" || mode === "review-card") {
      await page.getByRole("button", { name: "Mostrar respuesta" }).click();
      await expect(page.getByText("A precede a B.", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "La recordé", exact: true }).click();
    } else if (mode === "guide") await page.getByRole("button", { name: "Terminé esta lectura" }).click();
    else if (mode.includes("video")) await page.getByRole("button", { name: mode === "video" ? "Omitir video y completar" : "Completar video", exact: true }).click();
    else { await page.getByRole("radio").first().check(); await page.getByRole("button", { name: "Comprobar", exact: true }).click(); }
    await expect(page.getByRole("heading", { name: /Actividad completada|Repaso completado/ })).toBeVisible();
  });
}
