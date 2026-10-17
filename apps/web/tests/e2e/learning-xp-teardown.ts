/** Close only the explicitly marked local fixture, preserving earlier acceptance evidence. */
export default async function teardown() {
  if (process.env.KORAZ_TEST_DATABASE !== "true") throw new Error("Disposable database marker required");
  const base = "http://127.0.0.1:41035";
  let ready: { testOnly: boolean; database: string };
  try { ready = await (await fetch(`${base}/__test/ready`, { signal: AbortSignal.timeout(2000) })).json(); } catch { return; }
  if (!ready.testOnly || !/^koraz_guided_v2_test_[a-f0-9]{32}$/.test(ready.database)) throw new Error("Unknown fixture provenance");
  const result = await fetch(`${base}/__test/stop`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", signal: AbortSignal.timeout(3000) });
  if (!result.ok) throw new Error("Fixture shutdown failed");
}
