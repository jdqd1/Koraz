import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { RoutePackageSchema } from "@cediah/contracts";

export function abdominalCandidate() {
  const base = RoutePackageSchema.parse(JSON.parse(readFileSync(new URL(
    "../../../../docs/aprendizaje-guiado/v2/evidencias/RC01/pilot-review/ruta-approved.koraz-route.json", import.meta.url), "utf8")));
  const patch: { op: string; path: string; value: unknown }[] = JSON.parse(readFileSync(new URL(
    "../../../../docs/aprendizaje-guiado/plan-maestro/cava-r1.propuesta.patch.json", import.meta.url), "utf8"));
  const item = base.activities[13];
  assert(item?.kind === "short_answer");
  const aliases = "/activities/13/payload/acceptedAnswers";
  assert.deepEqual(patch.filter(entry => entry.op === "test"), [
    { op: "test", path: "/packageKey", value: base.packageKey },
    { op: "test", path: "/revision", value: base.revision },
    { op: "test", path: "/activities/13/key", value: item.key },
    { op: "test", path: aliases, value: item.payload.acceptedAnswers },
  ]);
  const changes = patch.filter(entry => entry.op === "replace");
  assert.equal(patch.length, 6);
  assert.deepEqual(changes.map(entry => entry.path), ["/revision", aliases]);
  const candidate = RoutePackageSchema.parse({
    ...base, revision: changes[0]!.value,
    activities: base.activities.map(activity => activity !== item ? activity : {
      ...item, payload: { ...item.payload, acceptedAnswers: changes[1]!.value },
    }),
  });
  return { base, candidate };
}
