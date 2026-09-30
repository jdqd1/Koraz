import Fastify from "fastify";
import { Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler, type CompiledQuery, type DatabaseConnection, type QueryResult } from "kysely";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { RoutePackageSchema, type RoutePackage, type IdentityProvider, type ContentProvider } from "@cediah/contracts";
import type { PGlite } from "@electric-sql/pglite";
import type { CediahDatabase } from "../src/db/database.js";
import { createPostgresGuidedV2AttemptService, createPostgresGuidedV2MetricsService } from "../src/providers/postgres-guided-learning-v2.js";
import { awardObjectiveV2, readLearningRewardsV2, readLearningRewardSummary } from "../src/guided-learning/rewards.js";
import { calculateMetricsV2, activeMillisecondsV2, heartbeatIntervalV2, registerGuidedV2MetricsRoutes, type MetricLearnerV2, type MetricAssessmentV2, type MetricAnswerV2 } from "../src/guided-learning/v2/metrics.js";
import { createGuidedV2Database, seedGuidedV2Runtime, v2Id } from "./helpers/guided-v2-db.js";
const start = Date.parse("2026-08-01T12:00:00Z");
const at = (days = 0, hours = 0) => new Date(start + days * 86400000 + hours * 3600000).toISOString();
const base = { objectiveKey: "core", relatedObjectiveKeys: [], required: true, sourceKeys: [],
  equivalenceKey: "family", hints: ["Pista"], use: "learning", prompt: "Pregunta sintética",
  feedback: { explanation: "Feedback sintético", commonError: "Revisar", sourceKeys: [] },
  misconceptionMappings: [], alternativeActivityKey: null };
const choice = (key: string, phase = "retrieve", representation = "text") => ({ ...base,
  key, equivalenceKey: key, phase, representation, kind: "single_choice",
  payload: { options: [{ key: "yes", text: "Sí" }, { key: "no", text: "No" }], correctKey: "yes", distractorFeedback: { no: "No" } } });
const study = (key: string, phase = "learn") => ({ ...base, key, equivalenceKey: key, phase,
  representation: "text", kind: "study", payload: { body: "Texto sintético", focusSpans: [], assetKey: null,
    scaffold: "explanation", videoRange: null } });
function definition(): RoutePackage {
  return RoutePackageSchema.parse({ schemaVersion: "2.0", packageKey: "evidence", revision: 1, locale: "es",
    route: { slug: "evidence-route", title: "Evidencia", summary: "Fixture", topicLabel: "Tema", audience: "Alumno", discipline: "general", coverKey: "heart" },
    policyVersion: "guided-v2.0", sources: [], assets: [],
    objectives: [{ key: "core", title: "Objetivo", unitKey: "unit", verb: "recall", criticality: "core", required: true,
      prerequisiteKeys: [], sourceKeys: [], comparisonGroup: null, misconceptions: [] }],
    units: [{ key: "unit", title: "Unidad", objectiveKeys: ["core"], activityKeys: ["explain", "recall-a", "recall-b", "apply"], support: "full", estimatedMinutes: null }],
    activities: [study("explain"), choice("recall-a"), choice("recall-b"), choice("apply", "apply", "diagram"),
      { ...choice("final"), use: "final" }, { ...choice("retention-seven"), use: "retention7" },
      { ...choice("retention-thirty"), use: "retention30" }, study("remediate", "remediate"), choice("verify"),
      choice("recall-c"), choice("recall-d"), choice("recall-e")],
    assessments: [{ key: "final-test", kind: "final", afterUnitKey: null, objectiveKeys: ["core"], candidateActivityKeys: ["final"],
      thresholdPercent: 80, thresholdRationale: "Umbral sintético documentado para comprobar la política." },
      ...(["retention7", "retention30"] as const).map((kind) => ({ key: kind === "retention7" ? "seven-test" : "thirty-test", kind,
        afterUnitKey: null, objectiveKeys: ["core"], candidateActivityKeys: [kind === "retention7" ? "retention-seven" : "retention-thirty"],
        thresholdPercent: 80, thresholdRationale: "Umbral sintético documentado para comprobar la retención." }))],
    reviewPlan: { objectiveKeys: [] }, editorial: { notes: "", unresolvedIssues: [] } });
}
function databaseFor(pg: PGlite): Kysely<CediahDatabase> {
  const connection: DatabaseConnection = { async executeQuery<R>(query: CompiledQuery): Promise<QueryResult<R>> {
    const result = await pg.query<R>(query.sql, [...query.parameters]);
    return { rows: result.rows, numAffectedRows: BigInt(result.affectedRows ?? 0) };
  }, async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> { yield { rows: [] }; } };
  return new Kysely<CediahDatabase>({ dialect: {
    createAdapter: () => new PostgresAdapter(), createIntrospector: (db) => new PostgresIntrospector(db), createQueryCompiler: () => new PostgresQueryCompiler(),
    createDriver: () => ({ acquireConnection: async () => connection, beginTransaction: async () => { await pg.exec("begin"); },
      commitTransaction: async () => { await pg.exec("commit"); }, rollbackTransaction: async () => { await pg.exec("rollback"); },
      destroy: async () => {}, init: async () => {}, releaseConnection: async () => {} }),
  } });
}


