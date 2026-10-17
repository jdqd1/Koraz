import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { validateRoutePackage } from "@cediah/contracts";
import { editorV2FixturePackage } from "./editor-fixtures";
import { reviewTaskV2 } from "./review-issues";
import { ReviewTasksV2 } from "./review-tasks";

const issue = (code: string, path: string, message = "Mensaje del validador") => ({ code, path, message, severity: "error" as const, suggestedFix: "Corrección del validador" });

describe("friendly review tasks", () => {
  it("keeps the bank requirements and shows the objective title instead of its internal key", () => {
    const pkg = editorV2FixturePackage();
    const task = reviewTaskV2(issue("BANK_TOO_SMALL", "/objectives/0"), pkg);
    expect(task.detail).toContain("5 preguntas");
    expect(task.detail).toContain("2 de memoria");
    expect(task.detail).toContain("aplicación");
    expect(task.detail).toContain("variantes");
    expect(task.context).toBe("Objetivo: Relacionar los ejemplos");
    expect(task.path).toBe("activity.new");
  });
  it("preserves the exclusive final, seven-day and thirty-day reservations", () => {
    const task = reviewTaskV2(issue("RESERVE_LEAK", "/objectives/0"), editorV2FixturePackage());
    expect(task.detail).toContain("final");
    expect(task.detail).toContain("7 días");
    expect(task.detail).toContain("30 días");
    expect(task.detail).toContain("exclusiva");
    expect(task.detail).toContain("No reutilices");
  });
  it("opens a matching unit assessment when present and the creation control when missing", () => {
    const pkg = editorV2FixturePackage();
    expect(reviewTaskV2(issue("CRITICAL_GATE_MISSING", "/objectives/0"), pkg).path).toBe("assessment.newKind");
    pkg.assessments.push({ ...pkg.assessments[0]!, key: "gate", kind: "unit_gate", afterUnitKey: "unit" });
    expect(reviewTaskV2(issue("CRITICAL_GATE_MISSING", "/objectives/0"), pkg).path).toBe("/assessments/1/objectiveKeys");
  });
  it("identifies the missing evaluation and its objective in plain language", () => {
    const pkg = editorV2FixturePackage();
    const task = reviewTaskV2(issue("RESERVE_LEAK", "/assessments", "La evaluación retention7 no cubre objective."), pkg);
    expect(task.title).toContain("control a 7 días");
    expect(task.context).toBe("Objetivo: Relacionar los ejemplos");
    expect(task.title).not.toContain("retention7");
  });
  it("keeps exact field navigation for incomplete answers and case stages", () => {
    const pkg = editorV2FixturePackage();
    const answer = issue("SCHEMA_INVALID", "/activities/1/payload/distractorFeedback");
    expect(reviewTaskV2(answer, pkg)).toMatchObject({ title: "Explica las opciones incorrectas", path: answer.path });
    const stage = issue("OBJECTIVE_COVERAGE", "/activities/7/payload/stages/1/childActivityKey", "La etapa no está en la secuencia del caso.");
    expect(reviewTaskV2(stage, pkg)).toMatchObject({ path: stage.path, context: "Etapa 2 del caso: Pregunta sintética" });
  });
  it("keeps pending checks for different units distinct and opens the existing initial assessment", () => {
    const pkg = editorV2FixturePackage();
    pkg.units.push({ ...pkg.units[0]!, key: "second", title: "Segunda unidad" });
    const issues = pkg.units.map(unit => issue("OBJECTIVE_COVERAGE", "/assessments", `Falta checkpoint después de ${unit.key}.`));
    const html = renderToStaticMarkup(<ReviewTasksV2 issues={issues} pkg={pkg} onLocate={() => {}} />);
    expect(html.match(/data-review-task=/g)).toHaveLength(2);
    expect(html).toContain("Segunda unidad");
    const diagnostic = issue("OBJECTIVE_COVERAGE", "/assessments", "Diagnóstico fuera de cobertura.");
    expect(reviewTaskV2(diagnostic, pkg).path).toBe("assessment.newKind");
    pkg.assessments.push({ ...pkg.assessments[0]!, key: "diagnostic", kind: "diagnostic" });
    expect(reviewTaskV2(diagnostic, pkg).path).toBe("/assessments/1/candidateActivityKeys");
  });
  it("does not change validators, issue severity, content or publication requirements", () => {
    const pkg = editorV2FixturePackage();
    const issues = validateRoutePackage(pkg).issues;
    const before = JSON.stringify({ pkg, issues });
    const text = issues.map(item => {
      const { title, detail, action, context } = reviewTaskV2(item, pkg);
      return [title, detail, action, context].join(" ");
    }).join(" ");
    expect(text).not.toMatch(/\b(?:CORE|equivalenceKey|unit_gate|retention7|retention30|wrapper|pool|hash)\b/);
    expect(JSON.stringify({ pkg, issues })).toBe(before);
  });
  it("keeps warnings distinct and groups only equivalent tasks without removing original issues", () => {
    const pkg = editorV2FixturePackage();
    const error = issue("CRITICAL_GATE_MISSING", "/units/0");
    const issues = [error, { ...error, message: "Otro aviso para la misma corrección" }, { ...error, severity: "warning" as const }];
    const html = renderToStaticMarkup(<ReviewTasksV2 issues={issues} pkg={pkg} onLocate={() => {}} />);
    expect(html.match(/data-review-task=/g)).toHaveLength(2);
    expect(html).toContain("1 pendiente");
    expect(html).toContain("1 sugerencia");
    expect(html).toContain('data-severity="warning"');
    expect(issues).toHaveLength(3);
  });
});
