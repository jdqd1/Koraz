# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: activity-player-redesign.spec.ts >> v2 image_target stays focused, responds and keeps system details on demand
- Location: tests\e2e\activity-player-redesign.spec.ts:83:7

# Error details

```
ZodError: [
  {
    "expected": "object",
    "code": "invalid_type",
    "path": [
      "payload",
      "targets",
      0,
      "marker"
    ],
    "message": "Invalid input: expected object, received undefined"
  }
]
```

# Test source

```ts
  1   | import { test, expect, type Page, type TestInfo } from "@playwright/test";
  2   | import AxeBuilder from "@axe-core/playwright";
  3   | import { V2HttpContracts, V2PublicActivitySchema, type V2AttemptManifest, type V2PublicActivity } from "@cediah/contracts";
  4   | import { studentFixture, fixtureId } from "../../src/components/learning/v2/fixtures";
  5   | import { legacyActivityFixture } from "../../src/components/learning/activities/activity-player-fixtures";
  6   | import { learningVisualProgress } from "../../src/components/learning/learning-visual-fixtures";
  7   | 
  8   | const source = { key: "source", title: "Fuente del ejercicio", citation: "Material sintético para verificar la interfaz.", locator: { heading: "Relaciones", sectionPath: ["Conceptos"], page: 2 }, excerpt: "A precede a B.", url: null };
  9   | const feedback = { explanation: "A precede a B: identifica primero el origen y después el resultado.", commonError: "No confundas el origen con el resultado.", sources: [source] };
  10  | const visualUrl = "https://activity-ui.example.test/figure.svg";
  11  | const figure = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360"><rect width="600" height="360" fill="#f4f7fc"/><path d="M300 70v180m0-100-100 60m100-60 110 65" fill="none" stroke="#6483ba" stroke-width="20" stroke-linecap="round"/><circle cx="300" cy="70" r="28" fill="#b4c7ea"/><text x="40" y="325" font-family="sans-serif" font-size="16" fill="#63708a">Figura de práctica</text></svg>';
  12  | 
  13  | function activityFor(mode: string): V2PublicActivity {
  14  |   const base = { key: "practice-a", objectiveKey: "objective-a", phase: "retrieve", representation: "text", prompt: "¿Qué concepto precede a B?" };
  15  |   const options = [{ key: "a", text: "Concepto A" }, { key: "b", text: "Concepto C" }, { key: "c", text: "Concepto D" }];
  16  |   const activity = mode === "study" || mode === "worked-example" || mode === "partial-example" ? { ...base, kind: "study", phase: "learn", prompt: "Comprende la relación entre A y B", payload: { body: "El concepto A precede a B. Primero identifica el origen y después relaciona el resultado.\n\nIntenta recuperar esta relación cuando pases a la práctica.", focusSpans: [{ start: 3, end: 26 }], assetKey: null, scaffold: mode === "worked-example" ? "worked_example" : mode === "partial-example" ? "partial_example" : "explanation", videoRange: null } }
  17  |     : mode === "short_answer" || mode === "constructed_response" ? { ...base, kind: mode, prompt: mode === "constructed_response" ? "Explica cómo se relacionan A y B" : base.prompt, payload: { maxChars: mode === "short_answer" ? 240 : 4000 } }
  18  |       : ["match", "comparison_table", "causal_map"].includes(mode) ? { ...base, kind: "match", prompt: "Relaciona cada concepto con su función", payload: { presentation: mode === "match" ? "pairs" : mode, prompts: [{ key: "p1", text: "Concepto A" }, { key: "p2", text: "Concepto B" }], choices: [{ key: "c1", text: "Origen" }, { key: "c2", text: "Resultado" }], allowReuse: false } }
  19  |         : mode === "sequence" ? { ...base, kind: "sequence", prompt: "Ordena la relación desde su origen", payload: { items: [{ key: "a", text: "Identificar el origen" }, { key: "b", text: "Reconocer el cambio" }, { key: "c", text: "Relacionar el resultado" }] } }
  20  |           : mode === "image_target" || mode === "labeling" ? { ...base, kind: "image_target", representation: "image", prompt: mode === "labeling" ? "Identifica los puntos de la imagen" : "Señala el origen en la imagen", payload: { assetKey: "figure", mode: mode === "labeling" ? "labeling" : "hotspot", masking: "no_labels", targets: [{ key: "origin", prompt: "Origen", marker: mode === "labeling" ? { x: .5, y: .2 } : null }], labels: mode === "labeling" ? [{ key: "a", text: "Origen" }, { key: "b", text: "Resultado" }] : [] } }
  21  |             : mode === "case-wrapper" ? { ...base, kind: "case", prompt: "Caso progresivo", payload: { activeStage: { key: "stage-a", narrative: "Un cambio en A modifica el resultado B.", childActivityKey: "child-a" } } }
  22  |               : { ...base, kind: "single_choice", ...(mode === "case" ? { representation: "case", prompt: "Un cambio en A modifica el resultado B. Observa la relación antes de responder.\n\n¿Qué concepto inicia este cambio?" } : {}), payload: { options } };
> 23  |   return V2PublicActivitySchema.parse(activity);
      |                                 ^ ZodError: [
  24  | }
  25  | 
  26  | async function mockPlayer(page: Page, mode: string, failFirst = false) {
  27  |   const fixture = studentFixture();
  28  |   let attempt: V2AttemptManifest = { ...fixture.attempt, activeActivity: activityFor(mode) };
  29  |   let state = fixture.state;
  30  |   const writes: { url: string; body: unknown; key: string | undefined }[] = [];
  31  |   // Permit only this synthetic media origin in the fixture document. Runtime CSP stays unchanged.
  32  |   await page.route("**/visual-fixtures/aprendizaje-v2?**", async route => {
  33  |     if (route.request().resourceType() !== "document") return route.continue();
  34  |     const response = await route.fetch(), headers = response.headers();
  35  |     if (headers["content-security-policy"]) headers["content-security-policy"] = headers["content-security-policy"].replace("img-src 'self'", "img-src 'self' https://activity-ui.example.test");
  36  |     await route.fulfill({ response, headers });
  37  |   });
  38  |   await page.route(visualUrl, route => route.fulfill({ contentType: "image/svg+xml", body: figure }));
  39  |   await page.route("**/api/v2/guided-learning/**", async route => {
  40  |     const request = route.request(), url = new URL(request.url()), path = url.pathname;
  41  |     if (request.method() === "GET") {
  42  |       if (path.endsWith("/image")) return route.fulfill({ json: V2HttpContracts.attemptImage.response.parse({ activityKey: attempt.activeActivity!.key, attemptVersion: attempt.rowVersion, image: { assetKey: "figure", url: visualUrl, alt: "Figura sintética de origen y ramas", expiresAt: "2035-01-01T00:00:00Z" } }) });
  43  |       return route.fulfill({ json: path.endsWith("/state") ? { state } : { attempt } });
  44  |     }
  45  |     const body = request.postDataJSON();
  46  |     writes.push({ url: path, body, key: request.headers()["idempotency-key"] });
  47  |     if (path.endsWith("/responses") && failFirst) { failFirst = false; return route.abort("failed"); }
  48  |     if (path.endsWith("/help")) {
  49  |       const parsed = V2HttpContracts.attemptHelp.body.parse(body);
  50  |       attempt = { ...attempt, rowVersion: attempt.rowVersion + 1 };
  51  |       if (parsed.kind === "reveal" && attempt.constructedResponse) attempt.constructedResponse = { ...attempt.constructedResponse, stage: "revealed", modelAnswer: "A precede a B.", rubric: [{ key: "origin", criterion: "Identifica el origen", example: "Reconoce A antes de relacionar B." }] };
  52  |       return route.fulfill({ json: V2HttpContracts.attemptHelp.response.parse({ attempt, help: { kind: parsed.kind, text: "Identifica el origen antes de relacionar el resultado." } }) });
  53  |     }
  54  |     if (path.endsWith("/responses")) {
  55  |       const parsed = V2HttpContracts.attemptResponse.body.parse(body);
  56  |       const accepted = parsed.answer.kind !== "constructed_response" || parsed.answer.selfRating !== null;
  57  |       const score01 = parsed.answer.kind === "study" || parsed.answer.kind === "constructed_response" ? null : 1;
  58  |       attempt = { ...attempt, rowVersion: attempt.rowVersion + 1 };
  59  |       if (!accepted && parsed.answer.kind === "constructed_response") attempt.constructedResponse = { activityKey: parsed.activityKey, text: parsed.answer.text, stage: "submitted" };
  60  |       if (accepted) {
  61  |         attempt = { ...attempt, activeActivity: null, constructedResponse: undefined, acceptedResponses: [...attempt.acceptedResponses, { activityKey: parsed.activityKey, answer: parsed.answer, serverAcceptedAt: "2026-10-12T12:00:00Z", score01, feedback }] };
  62  |         state = { ...state, rowVersion: state.rowVersion + 1, completedActivities: 3 };
  63  |       }
  64  |       return route.fulfill({ json: V2HttpContracts.attemptResponse.response.parse({ accepted, attempt, state, nextStep: attempt.activeActivity, feedback: { ...feedback, score01 } }) });
  65  |     }
  66  |     if (path.endsWith("/complete")) {
  67  |       V2HttpContracts.attemptComplete.body.parse(body);
  68  |       attempt = { ...attempt, status: "completed", rowVersion: attempt.rowVersion + 1 };
  69  |       state = { ...state, rowVersion: state.rowVersion + 1, nextAction: { kind: "activity", key: "practice-b", reason: "Continúa con el siguiente concepto." } };
  70  |       return route.fulfill({ json: V2HttpContracts.attemptComplete.response.parse({ attempt, state }) });
  71  |     }
  72  |     if (path.endsWith("/attempts")) {
  73  |       V2HttpContracts.attemptCreate.body.parse(body);
  74  |       return route.fulfill({ json: V2HttpContracts.attemptCreate.response.parse({ attempt: { ...attempt, attemptId: fixtureId(5), rowVersion: 1, status: "open", activeActivity: { ...activityFor("short_answer"), key: "practice-b" }, acceptedResponses: [] } }) });
  75  |     }
  76  |     return route.fulfill({ status: 404, json: { error: "unknown fixture request" } });
  77  |   });
  78  |   return writes;
  79  | }
  80  | 
  81  | async function capture(page: Page, info: TestInfo, name: string) {
  82  |   const geometry = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  83  |   expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width + 1);
  84  |   const scan = await new AxeBuilder({ page }).include('[aria-label="Sesión de aprendizaje"]').disableRules(["landmark-one-main", "region"]).analyze();
  85  |   expect(scan.violations.filter(item => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
  86  |   await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true, animations: "disabled", scale: "css" });
  87  | }
  88  | 
  89  | for (const mode of ["study", "worked-example", "partial-example", "single_choice", "short_answer", "constructed_response", "match", "comparison_table", "causal_map", "sequence", "image_target", "labeling", "case", "case-wrapper"]) {
  90  |   test(`v2 ${mode} stays focused, responds and keeps system details on demand`, async ({ page }, info) => {
  91  |     const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  92  |     await mockPlayer(page, mode);
  93  |     await page.goto(`/visual-fixtures/aprendizaje-v2?surface=player&estado=${mode}`);
  94  |     await expect(page.getByRole("heading", { name: "Tu sesión de aprendizaje" })).toBeVisible();
  95  |     await expect(page.getByText("Dominio por comprobar", { exact: true })).toBeHidden();
  96  |     await page.getByRole("button", { name: "Detalles de la sesión" }).click();
  97  |     await expect(page.getByText("Dominio por comprobar", { exact: true })).toBeVisible();
  98  |     await page.getByRole("button", { name: "Detalles de la sesión" }).click();
  99  |     if (mode === "image_target" || mode === "labeling") await expect(page.getByRole("img", { name: "Figura sintética de origen y ramas" })).toBeVisible();
  100 |     await capture(page, info, mode);
  101 |     if (mode === "case-wrapper") { await expect(page.getByText(/Recarga para continuar/)).toBeVisible(); return; }
  102 |     if (mode.includes("example") || mode === "study") await page.getByRole("button", { name: "Continuar a la práctica" }).click();
  103 |     else {
  104 |       if (mode === "single_choice" || mode === "case") await page.getByRole("radio").first().check();
  105 |       if (mode === "short_answer") await page.getByLabel("Tu respuesta", { exact: true }).fill("A");
  106 |       if (mode === "constructed_response") {
  107 |         await page.getByLabel("Explica con tus palabras").fill("A precede a B.");
  108 |         await page.getByRole("button", { name: "Guardar mi respuesta" }).click();
  109 |         await expect(page.getByRole("heading", { name: "Respuesta modelo" })).toHaveCount(0);
  110 |         await page.getByRole("button", { name: "Comparar con el modelo" }).click();
  111 |         await capture(page, info, "comparison");
  112 |         await page.getByRole("button", { name: "Lo recuperé", exact: true }).click();
  113 |       }
  114 |       if (["match", "comparison_table", "causal_map"].includes(mode)) {
  115 |         await page.getByRole("combobox").nth(0).selectOption("c1"); await page.getByRole("combobox").nth(1).selectOption("c2");
  116 |       }
  117 |       if (mode === "sequence") {
  118 |         await page.getByRole("button", { name: "Bajar: Identificar el origen", exact: true }).click();
  119 |         await expect(page.locator("ol > li").first()).toContainText("Reconocer el cambio");
  120 |         await page.getByRole("button", { name: "Subir: Identificar el origen", exact: true }).click();
  121 |       }
  122 |       if (mode === "image_target") await page.getByRole("group", { name: "Imagen para responder" }).click({ position: { x: 80, y: 100 } });
  123 |       if (mode === "labeling") await page.getByLabel("Punto 1: Origen").selectOption("a");
```