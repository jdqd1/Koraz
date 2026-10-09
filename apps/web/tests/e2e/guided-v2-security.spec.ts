import { test, expect, type Page } from "@playwright/test";

const api = "http://127.0.0.1:41035";
const learner = "/api/v2/guided-learning/";
const privateFields = /correctKey|correctByPrompt|correctLabelByTarget|acceptedAnswers|acceptedOrders|modelAnswer|rubric|polygon|snapshot_json|definition_v2_json|Explicación sintética confirmada\.|Recupera la relación del ejemplo\.|final-1|retention7-1|retention30-1/;
async function actor(page: Page, name: string) {
  await page.context().addCookies([{ name: "t035", value: name, domain: "127.0.0.1", path: "/" }]);
  await page.clock.setFixedTime(new Date("2026-10-04T12:00:00Z"));
}
async function post(page: Page, path: string, data: unknown, key = crypto.randomUUID()) {
  const r = await page.request.post(learner + path, { data, headers: { "idempotency-key": key } });
  expect(r.status(), await r.text()).toBe(200); return r.json();
}
async function state(page: Page, enrollmentId: string) {
  const r = await page.request.get(learner + `enrollments/${enrollmentId}/state`); expect(r.ok()).toBeTruthy(); return (await r.json()).state;
}
async function launch(page: Page, enrollmentId: string, key: string) {
  const s = await state(page, enrollmentId);
  return (await post(page, "attempts", { clientAttemptId: crypto.randomUUID(), enrollmentId, target: { kind: "activity", key }, expectedEnrollmentVersion: s.rowVersion })).attempt;
}
async function finish(page: Page, attemptId: string, rowVersion: number) {
  return post(page, `attempts/${attemptId}/complete`, { expectedVersion: rowVersion });
}

test("T036 S03 SSR, DOM, RSC and BFF hide solutions for every scored format and future case stages", async ({ page }, info) => {
  const user = info.project.name === "mobile" ? "student-33" : "student-32";
  await actor(page, user);
  const ready = await (await page.request.get(api + "/__test/ready")).json();
  const enrollmentId = (await post(page, "enrollments", { pathId: ready.fixtures.small.pathId })).state.enrollmentId;
  const captured: { url: string; status: number; body: string }[] = [];
  const pending: Promise<void>[] = [];
  let watching = false;
  page.on("response", response => {
    if (watching && response.url().includes(learner)) pending.push((async () => {
      captured.push({ url: new URL(response.url()).pathname, status: response.status(), body: await response.text() });
    })());
  });
  // Prerequisites are submitted over the real BFF. Every scored format below is
  // inspected before its own response or help authorizes feedback.
  const study = await launch(page, enrollmentId, "study-1");
  const studied = await post(page, `attempts/${study.attemptId}/responses`, { activityKey: "study-1", answer: { kind: "study", acknowledged: true }, confidence: null, expectedVersion: study.rowVersion });
  await finish(page, study.attemptId, studied.attempt.rowVersion);
  const snapshots: { key: string; ssrBytes: number; domBytes: number; rscBytes: number; manifest: unknown }[] = [];
  for (const key of ["constructed-1", "choice-1", "short-1", "apply-1", "match-1", "sequence-1", "image-1", "case-1"]) {
    let a = await launch(page, enrollmentId, key);
    const path = `/aprendizaje/sesiones/${a.attemptId}`;
    const ssr = await page.request.get(path); expect(ssr.status()).toBe(200);
    const html = await ssr.text(); expect(html).not.toMatch(privateFields);
    const rscResponse = await page.request.get(path, { headers: { RSC: "1" } });
    expect(rscResponse.status()).toBe(200); expect(rscResponse.headers()["content-type"]).toContain("text/x-component");
    const rsc = await rscResponse.text(); expect(rsc).not.toMatch(privateFields);
    watching = true;
    await page.goto(path);
    // App Router can briefly retain a hidden previous tree while streaming.
    // Wait for the current activity in the accessible tree before inspecting DOM.
    await expect(page.getByRole("heading", { name: a.activeActivity.prompt, exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Sesión de aprendizaje", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tu sesión de aprendizaje", exact: true })).toBeVisible();
    const dom = await page.content(); expect(dom).not.toMatch(privateFields);
    const manifestResponse = await page.request.get(learner + `attempts/${a.attemptId}`);
    expect(manifestResponse.status()).toBe(200); expect(manifestResponse.headers()["cache-control"]).toBe("private, no-store");
    const manifestText = await manifestResponse.text(); expect(manifestText).not.toMatch(privateFields);
    a = (await manifestResponse.json()).attempt;
    expect(a.activeActivity.key).toBe(key === "case-1" ? "case-choice-1" : key);
    if (key === "case-1") for (const text of [html, rsc, dom, manifestText]) expect(text).not.toMatch(/Etapa 2: relación sintética|case-short-1/);
    await Promise.all(pending); watching = false;
    for (const response of captured) { expect(response.status).toBe(200); expect(response.body).not.toMatch(privateFields); }
    snapshots.push({ key, ssrBytes: html.length, domBytes: dom.length, rscBytes: rsc.length, manifest: JSON.parse(manifestText) });
    // Inspect fresh RSC navigation as well as initial HTML; no hidden solutions.
    await page.reload(); expect(await page.content()).not.toMatch(privateFields);
    if (key === "constructed-1") {
      const early = await page.request.post(learner + `attempts/${a.attemptId}/help`, { data: { activityKey: key, kind: "reveal", expectedVersion: a.rowVersion }, headers: { "idempotency-key": crypto.randomUUID() } });
      expect(early.status()).toBe(409); expect(await early.text()).not.toMatch(privateFields);
      const submitted = await post(page, `attempts/${a.attemptId}/responses`, { activityKey: key, answer: { kind: "constructed_response", text: "Una relación sintética.", selfRating: null }, confidence: null, expectedVersion: a.rowVersion });
      expect(submitted.accepted).toBe(false);
      await page.reload(); expect(await page.content()).not.toMatch(/modelAnswer|rubric|Relaciona los ejemplos/);
      const revealed = await post(page, `attempts/${a.attemptId}/help`, { activityKey: key, kind: "reveal", expectedVersion: submitted.attempt.rowVersion });
      expect(revealed.help.text).toBe("Una relación sintética.");
      const rated = await post(page, `attempts/${a.attemptId}/responses`, { activityKey: key, answer: { kind: "constructed_response", text: "Una relación sintética.", selfRating: "good" }, confidence: null, expectedVersion: revealed.attempt.rowVersion });
      await finish(page, a.attemptId, rated.attempt.rowVersion);
    } else {
      const answers: Record<string, unknown> = {
        "choice-1": { kind: "single_choice", optionKey: "yes" }, "apply-1": { kind: "single_choice", optionKey: "yes" }, "short-1": { kind: "short_answer", text: "respuesta" },
        "match-1": { kind: "match", pairs: { p: "c" } }, "sequence-1": { kind: "sequence", orderedKeys: ["one", "two", "three"] },
        "image-1": { kind: "image_target", mode: "hotspot", targetKey: "target", point: { x: 0.2, y: 0.2 } },
        "case-1": { kind: "single_choice", optionKey: "yes" },
      };
      let response = await post(page, `attempts/${a.attemptId}/responses`, { activityKey: a.activeActivity.key, answer: answers[key], confidence: null, expectedVersion: a.rowVersion });
      if (key === "case-1") {
        expect(response.attempt.activeActivity.key).toBe("case-short-1");
        response = await post(page, `attempts/${a.attemptId}/responses`, { activityKey: "case-short-1", answer: { kind: "short_answer", text: "respuesta" }, confidence: null, expectedVersion: response.attempt.rowVersion });
      }
      await finish(page, a.attemptId, response.attempt.rowVersion);
    }
  }
  await test.info().attach("public-surfaces.json", { body: JSON.stringify({ snapshots, captured }), contentType: "application/json" });
  await page.screenshot({ path: info.outputPath("security-player.png"), fullPage: true });
});

test("T036 S01/S02/S07 hostile origin, foreign account and expired session cross the real BFF without writes", async ({ page }, info) => {
  await actor(page, info.project.name === "mobile" ? "student-35" : "student-34");
  const ready = await (await page.request.get(api + "/__test/ready")).json();
  const enrollmentId = (await post(page, "enrollments", { pathId: ready.fixtures.small.pathId })).state.enrollmentId;
  const a = await launch(page, enrollmentId, "study-1"), key = crypto.randomUUID();
  const body = { activityKey: "study-1", answer: { kind: "study", acknowledged: true }, confidence: null, expectedVersion: 1 };
  const counts = async () => (await (await page.request.get(api + "/__test/counts")).json());
  const before = await counts();
  const cross = await page.request.post(learner + `attempts/${a.attemptId}/responses`, { data: body, headers: { origin: "https://hostile.example", "idempotency-key": key } });
  expect(cross.status()).toBe(403);
  await actor(page, "student-36");
  const foreign = await page.request.get(learner + `attempts/${a.attemptId}`); expect(foreign.status()).toBe(404); expect(await foreign.json()).toEqual({ error: "not_found" });
  const editorial = await page.request.get(`/api/v2/editor/learning-paths/${ready.fixtures.editorial.pathId}`); expect(editorial.status()).toBe(403);
  await page.goto(`/aprendizaje/sesiones/${a.attemptId}`);
  expect(await page.content()).not.toContain("Contenido sintético para comprobar el software.");
  await actor(page, "expired");
  const expired = await page.request.post(learner + `attempts/${a.attemptId}/responses`, { data: body, headers: { "idempotency-key": key } }); expect(expired.status()).toBe(401);
  expect(await counts()).toEqual(before);
});
