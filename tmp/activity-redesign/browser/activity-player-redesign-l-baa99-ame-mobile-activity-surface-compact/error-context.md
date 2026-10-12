# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: activity-player-redesign.spec.ts >> legacy review-card uses the same mobile activity surface
- Location: tests\e2e\activity-player-redesign.spec.ts:164:7

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 163

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 4.2,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#707c94",
+               "fontSize": "9.0pt (12px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.2 (foreground color: #707c94, background color: #ffffff, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<main class=\"app-main\" data-pathname=\"/visual-fixtures/aprendizaje-v2\">",
+                 "target": Array [
+                   ".app-main",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.2 (foreground color: #707c94, background color: #ffffff, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Repaso</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".activity-ui-module__kAu9ea__headerTitle > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 4.2,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#707c94",
+               "fontSize": "9.8pt (13px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.2 (foreground color: #707c94, background color: #ffffff, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<main class=\"app-main\" data-pathname=\"/visual-fixtures/aprendizaje-v2\">",
+                 "target": Array [
+                   ".app-main",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.2 (foreground color: #707c94, background color: #ffffff, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>3<!-- --> de <!-- -->7</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".activity-ui-module__kAu9ea__progress > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 4.2,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#707c94",
+               "fontSize": "9.8pt (13px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.2 (foreground color: #707c94, background color: #ffffff, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<main class=\"app-main\" data-pathname=\"/visual-fixtures/aprendizaje-v2\">",
+                 "target": Array [
+                   ".app-main",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.2 (foreground color: #707c94, background color: #ffffff, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<div class=\"learning-activity-counter\">Ítem <!-- -->1<!-- --> de <!-- -->1</div>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".learning-activity-counter",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#fafbfe",
+               "contrastRatio": 3.92,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#717f94",
+               "fontSize": "9.8pt (13px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.92 (foreground color: #717f94, background color: #fafbfe, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<article><span>Intenta recordarlo antes de revelar</span><h2>Recuerda la relación entre A y B</h2></article>",
+                 "target": Array [
+                   "article",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.92 (foreground color: #717f94, background color: #fafbfe, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Intenta recordarlo antes de revelar</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "article > span",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
+     ],
+   },
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e4]:
    - main "Sesión de aprendizaje" [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]:
          - link "Volver a mi mapa" [ref=e8] [cursor=pointer]:
            - /url: /aprendizaje/mapa
          - generic [ref=e11]:
            - generic [ref=e12]: Repaso
            - heading "Repaso de conceptos" [level=1] [ref=e13]
          - group [ref=e14]:
            - button "Detalles de la sesión" [ref=e15] [cursor=pointer]
        - generic [ref=e18]:
          - progressbar "Avance de la ruta" [ref=e19]
          - generic [ref=e20]: 3 de 7
      - paragraph [ref=e21]
      - generic [ref=e22]:
        - generic [ref=e23]: Ítem 1 de 1
        - article [ref=e24]:
          - generic [ref=e25]: Intenta recordarlo antes de revelar
          - heading "Recuerda la relación entre A y B" [level=2] [ref=e26]
        - button "Mostrar respuesta" [ref=e27] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e33] [cursor=pointer]
  - alert [ref=e37]
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
  23  |   return V2PublicActivitySchema.parse(activity);
  24  | }
  25  | 
  26  | async function mockPlayer(page: Page, mode: string, failFirst = false) {
  27  |   const fixture = studentFixture();
  28  |   let attempt: V2AttemptManifest = { ...fixture.attempt, activeActivity: activityFor(mode) };
  29  |   let state = fixture.state;
  30  |   const writes: { url: string; body: unknown; key: string | undefined }[] = [];
  31  |   page.on("console", message => { if (message.type() === "error") console.log(message.text().slice(0, 500)); });
  32  |   // Permit only this synthetic media origin in the fixture document. Runtime CSP stays unchanged.
  33  |   await page.route("**/visual-fixtures/aprendizaje-v2?**", async route => {
  34  |     if (route.request().resourceType() !== "document") return route.continue();
  35  |     const response = await route.fetch(), headers = response.headers();
  36  |     if (headers["content-security-policy"]) headers["content-security-policy"] = headers["content-security-policy"].replace("img-src 'self'", "img-src 'self' https://activity-ui.example.test");
  37  |     await route.fulfill({ response, headers });
  38  |   });
  39  |   await page.route(visualUrl, route => route.fulfill({ contentType: "image/svg+xml", body: figure }));
  40  |   await page.route("**/api/v2/guided-learning/**", async route => {
  41  |     const request = route.request(), url = new URL(request.url()), path = url.pathname;
  42  |     if (request.method() === "GET") {
  43  |       if (path.endsWith("/image")) return route.fulfill({ json: V2HttpContracts.attemptImage.response.parse({ activityKey: attempt.activeActivity!.key, attemptVersion: attempt.rowVersion, image: { assetKey: "figure", url: visualUrl, alt: "Figura sintética de origen y ramas", expiresAt: "2035-01-01T00:00:00Z" } }) });
  44  |       return route.fulfill({ json: path.endsWith("/state") ? { state } : { attempt } });
  45  |     }
  46  |     const body = request.postDataJSON();
  47  |     writes.push({ url: path, body, key: request.headers()["idempotency-key"] });
  48  |     if (path.endsWith("/responses") && failFirst) { failFirst = false; return route.abort("failed"); }
  49  |     if (path.endsWith("/help")) {
  50  |       const parsed = V2HttpContracts.attemptHelp.body.parse(body);
  51  |       attempt = { ...attempt, rowVersion: attempt.rowVersion + 1 };
  52  |       if (parsed.kind === "reveal" && attempt.constructedResponse) attempt.constructedResponse = { ...attempt.constructedResponse, stage: "revealed", modelAnswer: "A precede a B.", rubric: [{ key: "origin", criterion: "Identifica el origen", example: "Reconoce A antes de relacionar B." }] };
  53  |       return route.fulfill({ json: V2HttpContracts.attemptHelp.response.parse({ attempt, help: { kind: parsed.kind, text: "Identifica el origen antes de relacionar el resultado." } }) });
  54  |     }
  55  |     if (path.endsWith("/responses")) {
  56  |       const parsed = V2HttpContracts.attemptResponse.body.parse(body);
  57  |       const accepted = parsed.answer.kind !== "constructed_response" || parsed.answer.selfRating !== null;
  58  |       const score01 = parsed.answer.kind === "study" || parsed.answer.kind === "constructed_response" ? null : 1;
  59  |       attempt = { ...attempt, rowVersion: attempt.rowVersion + 1 };
  60  |       if (!accepted && parsed.answer.kind === "constructed_response") attempt.constructedResponse = { activityKey: parsed.activityKey, text: parsed.answer.text, stage: "submitted" };
  61  |       if (accepted) {
  62  |         attempt = { ...attempt, activeActivity: null, constructedResponse: undefined, acceptedResponses: [...attempt.acceptedResponses, { activityKey: parsed.activityKey, answer: parsed.answer, serverAcceptedAt: "2026-10-12T12:00:00Z", score01, feedback }] };
  63  |         state = { ...state, rowVersion: state.rowVersion + 1, completedActivities: 3 };
  64  |       }
  65  |       return route.fulfill({ json: V2HttpContracts.attemptResponse.response.parse({ accepted, attempt, state, nextStep: attempt.activeActivity, feedback: { ...feedback, score01 } }) });
  66  |     }
  67  |     if (path.endsWith("/complete")) {
  68  |       V2HttpContracts.attemptComplete.body.parse(body);
  69  |       attempt = { ...attempt, status: "completed", rowVersion: attempt.rowVersion + 1 };
  70  |       state = { ...state, rowVersion: state.rowVersion + 1, nextAction: { kind: "activity", key: "practice-b", reason: "Continúa con el siguiente concepto." } };
  71  |       return route.fulfill({ json: V2HttpContracts.attemptComplete.response.parse({ attempt, state }) });
  72  |     }
  73  |     if (path.endsWith("/attempts")) {
  74  |       V2HttpContracts.attemptCreate.body.parse(body);
  75  |       return route.fulfill({ json: V2HttpContracts.attemptCreate.response.parse({ attempt: { ...attempt, attemptId: fixtureId(5), rowVersion: 1, status: "open", activeActivity: { ...activityFor("short_answer"), key: "practice-b" }, acceptedResponses: [] } }) });
  76  |     }
  77  |     return route.fulfill({ status: 404, json: { error: "unknown fixture request" } });
  78  |   });
  79  |   return writes;
  80  | }
  81  | 
  82  | async function capture(page: Page, info: TestInfo, name: string) {
  83  |   const geometry = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  84  |   expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width + 1);
  85  |   const scan = await new AxeBuilder({ page }).include('[aria-label="Sesión de aprendizaje"]').disableRules(["landmark-one-main", "region"]).analyze();
> 86  |   expect(scan.violations.filter(item => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
      |                                                                                               ^ Error: expect(received).toEqual(expected) // deep equality
  87  |   await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true, animations: "disabled", scale: "css" });
  88  | }
  89  | 
  90  | for (const mode of ["study", "worked-example", "partial-example", "single_choice", "short_answer", "constructed_response", "match", "comparison_table", "causal_map", "sequence", "image_target", "labeling", "case", "case-wrapper"]) {
  91  |   test(`v2 ${mode} stays focused, responds and keeps system details on demand`, async ({ page }, info) => {
  92  |     const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  93  |     await mockPlayer(page, mode);
  94  |     await page.goto(`/visual-fixtures/aprendizaje-v2?surface=player&estado=${mode}`);
  95  |     await expect(page.getByRole("heading", { name: "Tu sesión de aprendizaje" })).toBeVisible();
  96  |     await expect(page.getByText("Dominio por comprobar", { exact: true })).toBeHidden();
  97  |     await page.getByRole("button", { name: "Detalles de la sesión" }).click();
  98  |     await expect(page.getByText("Dominio por comprobar", { exact: true })).toBeVisible();
  99  |     await page.getByRole("button", { name: "Detalles de la sesión" }).click();
  100 |     if (mode === "image_target" || mode === "labeling") await expect(page.getByRole("img", { name: "Figura sintética de origen y ramas" })).toBeVisible();
  101 |     await capture(page, info, mode);
  102 |     if (mode === "case-wrapper") { await expect(page.getByText(/Recarga para continuar/)).toBeVisible(); return; }
  103 |     if (mode.includes("example") || mode === "study") await page.getByRole("button", { name: "Continuar a la práctica" }).click();
  104 |     else {
  105 |       if (mode === "single_choice" || mode === "case") await page.getByRole("radio").first().check();
  106 |       if (mode === "short_answer") await page.getByLabel("Tu respuesta", { exact: true }).fill("A");
  107 |       if (mode === "constructed_response") {
  108 |         await page.getByLabel("Explica con tus palabras").fill("A precede a B.");
  109 |         await page.getByRole("button", { name: "Guardar mi respuesta" }).click();
  110 |         await expect(page.getByRole("heading", { name: "Respuesta modelo" })).toHaveCount(0);
  111 |         await page.getByRole("button", { name: "Comparar con el modelo" }).click();
  112 |         await capture(page, info, "comparison");
  113 |         await page.getByRole("button", { name: "Lo recuperé", exact: true }).click();
  114 |       }
  115 |       if (["match", "comparison_table", "causal_map"].includes(mode)) {
  116 |         await page.getByRole("combobox").nth(0).selectOption("c1"); await page.getByRole("combobox").nth(1).selectOption("c2");
  117 |       }
  118 |       if (mode === "sequence") {
  119 |         await page.getByRole("button", { name: "Bajar: Identificar el origen", exact: true }).click();
  120 |         await expect(page.locator("ol > li").first()).toContainText("Reconocer el cambio");
  121 |         await page.getByRole("button", { name: "Subir: Identificar el origen", exact: true }).click();
  122 |       }
  123 |       if (mode === "image_target") await page.getByRole("group", { name: "Imagen para responder" }).click({ position: { x: 80, y: 100 } });
  124 |       if (mode === "labeling") await page.getByLabel("Punto 1: Origen").selectOption("a");
  125 |       if (mode !== "constructed_response") await page.getByRole("button", { name: /^Comprobar/ }).click();
  126 |       await expect(page.getByRole("heading", { name: mode === "constructed_response" ? "Práctica registrada" : "Respuesta correcta", exact: true })).toBeVisible();
  127 |       await expect(page.getByText(source.citation, { exact: true })).toBeHidden();
  128 |       if (mode === "short_answer") await capture(page, info, "feedback");
  129 |       await page.getByRole("button", { name: "Continuar", exact: true }).click();
  130 |     }
  131 |     const finish = page.getByRole("button", { name: "Finalizar sesión", exact: true });
  132 |     if (await finish.isVisible()) await finish.click();
  133 |     await expect(page.getByRole("heading", { name: "Sesión completada", exact: true })).toBeVisible();
  134 |     await expect(page.getByRole("button", { name: "Siguiente actividad", exact: true })).toBeVisible();
  135 |     expect(errors).toEqual([]);
  136 |   });
  137 | }
  138 | 
  139 | test("lost writes retry once with the same identity; next activity starts directly and preserves map exit", async ({ page }, info) => {
  140 |   const writes = await mockPlayer(page, "short_answer", true);
  141 |   await page.goto("/visual-fixtures/aprendizaje-v2?surface=player&estado=short_answer");
  142 |   await page.getByLabel("Tu respuesta", { exact: true }).fill("A");
  143 |   await page.getByRole("button", { name: "Necesito ayuda", exact: true }).click();
  144 |   await expect(page.getByRole("heading", { name: "Pista", exact: true })).toBeVisible();
  145 |   await page.getByRole("button", { name: "Ocultar ayuda", exact: true }).click();
  146 |   await page.getByRole("button", { name: "Comprobar respuesta", exact: true }).click();
  147 |   await expect(page.getByRole("button", { name: "Reintentar solicitud pendiente" })).toBeVisible();
  148 |   await expect(page.getByRole("button", { name: "Comprobar respuesta", exact: true })).toBeDisabled();
  149 |   await capture(page, info, "connection-error");
  150 |   await page.getByRole("button", { name: "Reintentar solicitud pendiente" }).click();
  151 |   await page.getByRole("button", { name: "Continuar", exact: true }).click();
  152 |   await expect(page.getByRole("heading", { name: "Sesión completada", exact: true })).toBeVisible();
  153 |   const responses = writes.filter(write => write.url.endsWith("/responses"));
  154 |   expect(responses).toHaveLength(2); expect(responses[0]).toEqual(responses[1]);
  155 |   await page.route(`**/aprendizaje/sesiones/${fixtureId(5)}?*`, route => route.fulfill({ contentType: "text/html", body: "<main>Siguiente sesión confirmada</main>" }));
  156 |   await page.getByRole("button", { name: "Siguiente actividad", exact: true }).click();
  157 |   await expect(page).toHaveURL(new RegExp(`/aprendizaje/sesiones/${fixtureId(5)}\\?returnTo=`));
  158 |   const launch = writes.find(write => write.url.endsWith("/attempts"));
  159 |   expect(launch?.body).toMatchObject({ enrollmentId: fixtureId(3), target: { kind: "activity", key: "practice-b" } });
  160 |   expect(new URL(page.url()).searchParams.get("returnTo")).toBe("/aprendizaje/mapa");
  161 | });
  162 | 
  163 | for (const mode of ["quiz", "flashcards", "guide", "review", "review-card", "video", "external-video"]) {
  164 |   test(`legacy ${mode} uses the same mobile activity surface`, async ({ page }, info) => {
  165 |     let attempt = legacyActivityFixture(mode);
  166 |     await page.route("**/api/guided-learning/attempts/**", async route => {
  167 |       if (route.request().method() === "GET") return route.fulfill({ status: 403, json: { error: "fixture has no real media" } });
  168 |       const body = route.request().postDataJSON();
  169 |       const reveal = route.request().url().endsWith("/reveal");
  170 |       attempt = { ...attempt, rowVersion: attempt.rowVersion + 1, ...(reveal ? { revealedCards: [{ itemId: body.itemId ?? (attempt.manifest.projection === "flashcards" ? attempt.manifest.cards[0]!.itemId : attempt.manifest.projection === "review" ? attempt.manifest.items[0]!.itemId : attempt.id), back: "A precede a B." }] } : { status: "completed", submittedAt: "2026-10-12T12:00:00Z" }) };
  171 |       return route.fulfill({ json: { attempt, awards: [], feedback: null, progress: learningVisualProgress, saved: true } });
  172 |     });
  173 |     await page.goto(`/visual-fixtures/aprendizaje-v2?surface=legacy-player&estado=${mode}`);
  174 |     await expect(page.getByRole("heading", { name: /Práctica de conceptos|Repaso de conceptos/ })).toBeVisible();
  175 |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  176 |     await capture(page, info, mode);
  177 |     if (mode === "flashcards" || mode === "review-card") {
  178 |       await page.getByRole("button", { name: "Mostrar respuesta" }).click();
  179 |       await expect(page.getByText("A precede a B.", { exact: true })).toBeVisible();
  180 |       await page.getByRole("button", { name: "La recordé", exact: true }).click();
  181 |     } else if (mode === "guide") await page.getByRole("button", { name: "Terminé esta lectura" }).click();
  182 |     else if (mode.includes("video")) await page.getByRole("button", { name: mode === "video" ? "Omitir video y completar" : "Completar video", exact: true }).click();
  183 |     else { await page.getByRole("radio").first().check(); await page.getByRole("button", { name: "Comprobar", exact: true }).click(); }
  184 |     await expect(page.getByRole("heading", { name: /Actividad completada|Repaso completado/ })).toBeVisible();
  185 |   });
  186 | }
```