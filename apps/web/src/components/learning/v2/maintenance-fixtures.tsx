import { V2MaintenanceSchema } from "@cediah/contracts";
import { studentFixture } from "./fixtures";

/** Test-only public state; never used as a runtime fallback. */
export function maintenanceFixture(mode = "pending") {
  const fixture = studentFixture(mode === "review" ? "review" : mode === "exhausted" ? "critical" : mode === "consolidated" ? "consolidated" : "ready");
  const measurement = { dueAt: "2026-10-10T02:30:00.000Z", acceptedAt: null, elapsedDays: null };
  const maintenance = V2MaintenanceSchema.parse({
    generatedAt: "2026-10-04T02:30:00.000Z", timeZone: "America/Caracas",
    diagnostic: { status: mode === "pending" ? "pending" : "omitted", assessmentKey: mode === "pending" ? "diagnosis" : null },
    activities: [{ key: "practice-b", objectiveKey: "objective-b", reason: "Siguiente actividad de la rama disponible" }],
    reviewBatch: mode === "review" ? [{ key: "review-a", objectiveKey: "objective-a", dueAt: "2026-10-03T02:30:00.000Z" }] : [],
    agenda: [{ objectiveKey: "objective-a", dueAt: "2026-10-03T02:30:00.000Z", retention7: mode === "consolidated" ? { ...measurement, acceptedAt: "2026-10-12T02:30:00.000Z", elapsedDays: 9.5 } : measurement,
      retention30: { dueAt: "2026-11-02T02:30:00.000Z", acceptedAt: null, elapsedDays: null } }],
    gates: [{ unitKey: "unit-a", passed: false, score: 50, thresholdPercent: 80, missingCoreKeys: ["objective-a"], criticalErrorKeys: mode === "exhausted" ? ["objective-a"] : [] }],
    blockers: [{ objectiveKey: "objective-a", blockedBy: ["objective-b"] }],
    remediation: mode === "exhausted" ? [{ objectiveKey: "objective-a", confusion: "Confusión sintética confirmada", message: "Puedes pausar o elegir otra rama", activityKey: null, bankExhausted: true, availableAfter: "2026-10-05T02:30:00.000Z", pauseOffered: true }] : [],
    exhaustedBanks: [],
  });
  return { ...fixture, state: { ...fixture.state, maintenance } };
}
