import { z } from "zod";
import { RoutePackageSchema, type RouteActivity, type RoutePackage } from "./learning-route-package.js";

export type RouteValidationIssue = {
  code: string;
  severity: "error" | "warning";
  path: string;
  message: string;
  suggestedFix: string;
};
export type RouteValidationResult = {
  scope: "portable" | "bound";
  valid: boolean;
  publishable: boolean;
  issues: RouteValidationIssue[];
};

const pointer = (parts: readonly PropertyKey[]) => parts.length ? `/${parts.map((part) => String(part).replaceAll("~", "~0").replaceAll("/", "~1")).join("/")}` : "";

export function validateRoutePackage(input: unknown): RouteValidationResult {
  const parsed = RoutePackageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      scope: "portable", valid: false, publishable: false,
      issues: parsed.error.issues.map((issue) => ({
        code: "SCHEMA_INVALID", severity: "error", path: pointer(issue.path),
        message: `Estructura inválida: ${issue.message}`, suggestedFix: "Corrige el campo según el esquema 2.0.",
      })),
    };
  }
  const pkg = parsed.data;
  const issues: RouteValidationIssue[] = [];
  const add = (code: string, path: string, message: string, suggestedFix: string) => issues.push({ code, severity: "error", path, message, suggestedFix });
  const unique = <T extends { key: string }>(items: T[], path: string) => {
    const seen = new Set<string>();
    for (const [i, item] of items.entries()) {
      if (seen.has(item.key)) add("DUPLICATE_KEY", `${path}/${i}/key`, `Clave duplicada: ${item.key}.`, "Usa una clave local única en esta colección.");
      seen.add(item.key);
    }
    return seen;
  };
  const sources = unique(pkg.sources, "/sources");
  const assets = unique(pkg.assets, "/assets");
  const objectives = new Set(pkg.objectives.map((item) => item.key));
  const units = new Set(pkg.units.map((item) => item.key));
  const activities = new Set(pkg.activities.map((item) => item.key));
  unique(pkg.assessments, "/assessments");
  const ref = (keys: string[], known: Set<string>, path: string) => keys.forEach((key, i) => {
    if (!known.has(key)) add("REFERENCE_MISSING", `${path}/${i}`, `Referencia inexistente: ${key}.`, "Crea el elemento referido o elimina la referencia.");
  });
  for (const [i, item] of pkg.assets.entries()) ref(item.sourceKeys, sources, `/assets/${i}/sourceKeys`);
  for (const [i, item] of pkg.objectives.entries()) {
    ref(item.sourceKeys, sources, `/objectives/${i}/sourceKeys`);
    for (const [j, misconception] of item.misconceptions.entries()) {
      if (!activities.has(misconception.remediationActivityKey)) add("REFERENCE_MISSING", `/objectives/${i}/misconceptions/${j}/remediationActivityKey`, "Falta la remediación.", "Vincula una actividad existente.");
      ref(misconception.verificationActivityKeys, activities, `/objectives/${i}/misconceptions/${j}/verificationActivityKeys`);
    }
  }
  for (const [i, item] of pkg.activities.entries()) {
    ref(item.sourceKeys, sources, `/activities/${i}/sourceKeys`);
    ref(item.feedback.sourceKeys, sources, `/activities/${i}/feedback/sourceKeys`);
    if (item.alternativeActivityKey && !activities.has(item.alternativeActivityKey)) add("REFERENCE_MISSING", `/activities/${i}/alternativeActivityKey`, "Falta la actividad alternativa.", "Vincula una actividad existente.");
    if (item.kind === "study") {
      if (item.payload.assetKey && !assets.has(item.payload.assetKey)) add("REFERENCE_MISSING", `/activities/${i}/payload/assetKey`, "Falta el asset.", "Vincula un asset existente.");
      for (const [j, span] of item.payload.focusSpans.entries()) if (span.end <= span.start || span.end > item.payload.body.length) add("SCHEMA_INVALID", `/activities/${i}/payload/focusSpans/${j}`, "Offset fuera del texto.", "Ajusta inicio y fin al cuerpo.");
      if (item.payload.videoRange && item.payload.videoRange.endSeconds <= item.payload.videoRange.startSeconds) add("SCHEMA_INVALID", `/activities/${i}/payload/videoRange`, "Rango de video inválido.", "El fin debe superar el inicio.");
    }
    if (item.kind === "single_choice") {
      const optionKeys = item.payload.options.map((option) => option.key);
      if (new Set(optionKeys).size !== optionKeys.length || !optionKeys.includes(item.payload.correctKey)) add("SCHEMA_INVALID", `/activities/${i}/payload/options`, "Opciones duplicadas o respuesta inexistente.", "Usa claves únicas y una respuesta presente.");
      const incorrect = optionKeys.filter((option) => option !== item.payload.correctKey);
      if (Object.keys(item.payload.distractorFeedback).length !== incorrect.length || incorrect.some((option) => !item.payload.distractorFeedback[option])) add("SCHEMA_INVALID", `/activities/${i}/payload/distractorFeedback`, "Feedback de distractores incompleto.", "Explica cada opción incorrecta y ninguna otra.");
    }
    if (item.kind === "short_answer" && item.payload.acceptedAnswers.some((answer) => answer.length > item.payload.maxChars)) add("SCHEMA_INVALID", `/activities/${i}/payload/acceptedAnswers`, "Un alias supera maxChars.", "Ajusta la respuesta o el límite.");
    if (item.kind === "match") {
      const prompts = item.payload.prompts.map((entry) => entry.key);
      const choices = item.payload.choices.map((entry) => entry.key);
      const mapping = item.payload.correctByPrompt;
      if (new Set(prompts).size !== prompts.length || new Set(choices).size !== choices.length || Object.keys(mapping).length !== prompts.length || prompts.some((prompt) => !choices.includes(mapping[prompt] ?? ""))) add("SCHEMA_INVALID", `/activities/${i}/payload/correctByPrompt`, "Correspondencias incompletas o claves duplicadas.", "Define una opción existente por cada enunciado.");
      if (!item.payload.allowReuse && new Set(Object.values(mapping)).size !== Object.values(mapping).length) add("SCHEMA_INVALID", `/activities/${i}/payload/allowReuse`, "Se reutiliza una opción no permitida.", "Activa allowReuse o usa opciones distintas.");
      if (item.payload.presentation !== "causal_map" && item.payload.edges.length) add("SCHEMA_INVALID", `/activities/${i}/payload/edges`, "Solo causal_map admite aristas.", "Quita las aristas o cambia la presentación.");
    }
    if (item.kind === "image_target") {
      if (!assets.has(item.payload.assetKey)) add("REFERENCE_MISSING", `/activities/${i}/payload/assetKey`, "Falta la imagen.", "Vincula un asset existente.");
      if (!activities.has(item.payload.accessibleAlternativeKey)) add("REFERENCE_MISSING", `/activities/${i}/payload/accessibleAlternativeKey`, "Falta alternativa accesible.", "Vincula una actividad existente.");
      const targetKeys = item.payload.targets.map((target) => target.key);
      const labelKeys = item.payload.labels.map((label) => label.key);
      if (new Set(targetKeys).size !== targetKeys.length || new Set(labelKeys).size !== labelKeys.length) add("SCHEMA_INVALID", `/activities/${i}/payload`, "Claves duplicadas de imagen.", "Usa claves únicas.");
      if (item.payload.mode === "labeling" && (Object.keys(item.payload.correctLabelByTarget).length !== targetKeys.length || targetKeys.some((target) => !labelKeys.includes(item.payload.correctLabelByTarget[target] ?? "")))) add("SCHEMA_INVALID", `/activities/${i}/payload/correctLabelByTarget`, "Etiquetas incompletas.", "Asigna una etiqueta existente a cada objetivo.");
      if (item.payload.mode === "hotspot" && Object.keys(item.payload.correctLabelByTarget).length) add("SCHEMA_INVALID", `/activities/${i}/payload/correctLabelByTarget`, "Un hotspot no usa etiquetas correctas.", "Deja el mapa vacío.");
      for (const [j, target] of item.payload.targets.entries()) if (!validPolygon(target.polygon)) add("SCHEMA_INVALID", `/activities/${i}/payload/targets/${j}/polygon`, "Polígono inválido.", "Usa al menos tres puntos distintos, área positiva y sin cruces.");
    }
    if (item.kind === "constructed_response" && item.payload.verificationActivityKey && !activities.has(item.payload.verificationActivityKey)) add("REFERENCE_MISSING", `/activities/${i}/payload/verificationActivityKey`, "Falta verificación objetiva.", "Vincula una actividad existente.");
    if (item.kind === "sequence") {
      if (item.payload.whyActivityKey && !activities.has(item.payload.whyActivityKey)) add("REFERENCE_MISSING", `/activities/${i}/payload/whyActivityKey`, "Falta explicación vinculada.", "Vincula una actividad existente.");
      const keys = item.payload.items.map((entry) => entry.key);
      if (new Set(keys).size !== keys.length || item.payload.acceptedOrders.some((order) => order.length !== keys.length || new Set(order).size !== keys.length || order.some((entry) => !keys.includes(entry)))) add("SCHEMA_INVALID", `/activities/${i}/payload/acceptedOrders`, "Orden inválido.", "Cada orden debe ser una permutación exacta sin duplicados.");
    }
    if (item.kind === "case") {
      const children = item.payload.stages.map((stage) => stage.childActivityKey);
      ref(children, activities, `/activities/${i}/payload/stages`);
      if (new Set(children).size !== children.length || children.some((child) => pkg.activities.find((entry) => entry.key === child)?.kind === "case")) add("SCHEMA_INVALID", `/activities/${i}/payload/stages`, "Caso anidado o hijo repetido.", "Usa hijos distintos que no sean casos.");
    }
  }
  for (const [i, assessment] of pkg.assessments.entries()) {
    if (assessment.afterUnitKey && !units.has(assessment.afterUnitKey)) add("REFERENCE_MISSING", `/assessments/${i}/afterUnitKey`, "Falta unidad de evaluación.", "Vincula una unidad existente.");
    ref(assessment.objectiveKeys, objectives, `/assessments/${i}/objectiveKeys`);
    ref(assessment.candidateActivityKeys, activities, `/assessments/${i}/candidateActivityKeys`);
  }
  ref(pkg.reviewPlan.objectiveKeys, objectives, "/reviewPlan/objectiveKeys");
  issues.push(...analyzeRouteGraph(pkg).issues);

  issues.push(...validatePortablePublication(pkg));
  const valid = !issues.some((issue) => ["SCHEMA_INVALID", "DUPLICATE_KEY"].includes(issue.code));
  return { scope: "portable", valid, publishable: valid && !issues.some((issue) => issue.severity === "error"), issues };
}

const isObjectiveItem = (activity: RouteActivity) =>
  activity.kind === "single_choice" || activity.kind === "short_answer" ||
  activity.kind === "match" || activity.kind === "sequence" ||
  (activity.kind === "image_target" && activity.payload.masking === "no_labels");
const isInitialPool = (activity: RouteActivity) => activity.use === "learning" || activity.use === "gate";
const reserveUses = ["final", "retention7", "retention30"] as const;

/** Portable checks can approve editorial structure, never catalog rights or clinical accuracy. */
export function validatePortablePublication(pkg: RoutePackage): RouteValidationIssue[] {
  const issues: RouteValidationIssue[] = [];
  const add = (code: string, path: string, message: string, suggestedFix: string, severity: "error" | "warning" = "error") => issues.push({ code, severity, path, message, suggestedFix });
  const activityByKey = new Map(pkg.activities.map((item) => [item.key, item]));
  const sourceByKey = new Map(pkg.sources.map((item) => [item.key, item]));
  const assessmentsByKind = new Map<string, typeof pkg.assessments>();
  for (const assessment of pkg.assessments) assessmentsByKind.set(assessment.kind, [...(assessmentsByKind.get(assessment.kind) ?? []), assessment]);
  if (!pkg.units.length || !pkg.objectives.some((objective) => objective.criticality === "core" && objective.required))
    add("OBJECTIVE_COVERAGE", "/objectives", "La ruta necesita una unidad y un objetivo CORE requerido.", "Añade una unidad y un objetivo CORE requerido.");
  if (pkg.editorial.unresolvedIssues.some((issue) => issue.severity === "error"))
    add("OBJECTIVE_COVERAGE", "/editorial/unresolvedIssues", "Hay incidencias editoriales abiertas.", "Resuelve cada incidencia antes de publicar.");

  for (const [i, source] of pkg.sources.entries()) {
    if (!source.excerpt.trim() || !(source.locator.heading.trim() || source.locator.sectionPath.length || source.locator.page))
      add("SOURCE_UNRESOLVED", `/sources/${i}`, "La fuente no tiene fragmento localizable.", "Añade texto de fragmento y sección o página verificable.");
    if (source.verification === "unverified")
      add("SOURCE_UNRESOLVED", `/sources/${i}/verification`, "Fuente sin verificar.", "Registra la revisión bibliográfica.");
    if (/turn\d+(?:search|view|fetch)\d+/i.test(source.citation) && !/(?:https:\/\/|doi[:\s]|10\.\d{4,9}\/)/i.test(source.citation))
      add("SOURCE_UNRESOLVED", `/sources/${i}/citation`, "Un marcador de búsqueda no es una referencia bibliográfica.", "Sustitúyelo por título, autores y DOI o URL verificable.");
  }
  for (const [i, asset] of pkg.assets.entries()) {
    if (asset.rightsStatus === "unverified") add("ASSET_RIGHTS", `/assets/${i}/rightsStatus`, "Derechos del asset sin verificar.", "Documenta titularidad o licencia.");
    if (asset.mediaType === "image" && (!asset.alt.trim() || asset.width === null || asset.height === null))
      add("ASSET_REQUIRED", `/assets/${i}`, "La imagen necesita alternativa y dimensiones para mostrarse correctamente.", "Añade alt y dimensiones revisadas.");
    if (asset.rightsStatus === "licensed" && !asset.credit.trim())
      add("ASSET_RIGHTS", `/assets/${i}/credit`, "Falta el crédito exigido para la imagen licenciada.", "Añade el crédito y verifica sus términos.");
  }

  const familyUse = new Map<string, { activityKey: string; objectiveKey: string; use: string }[]>();
  for (const [i, activity] of pkg.activities.entries()) {
    const family = familyUse.get(activity.equivalenceKey) ?? [];
    family.push({ activityKey: activity.key, objectiveKey: activity.objectiveKey, use: activity.use });
    familyUse.set(activity.equivalenceKey, family);
    if (!activity.sourceKeys.some((key) => sourceByKey.get(key)?.excerpt.trim()))
      add("REFERENCE_MISSING", `/activities/${i}/sourceKeys`, "La actividad no remite a un fragmento fuente.", "Vincula al menos una fuente con fragmento verificable.");
    if (!activity.feedback.sourceKeys.some((key) => sourceByKey.get(key)?.excerpt.trim()))
      add("REFERENCE_MISSING", `/activities/${i}/feedback/sourceKeys`, "El feedback carece de fuente.", "Vincula el feedback con el fragmento que fundamenta la corrección.");
    if (/\b(?:TODO|TBD|por completar)\b/i.test(`${activity.prompt} ${activity.feedback.explanation}`))
      add("OBJECTIVE_COVERAGE", `/activities/${i}`, "La actividad contiene texto pendiente.", "Sustituye el marcador por contenido revisado.");
  }
  for (const [family, uses] of familyUse) {
    if (uses.some((item) => reserveUses.includes(item.use as typeof reserveUses[number])) && uses.length > 1) {
      const first = uses.find((item) => reserveUses.includes(item.use as typeof reserveUses[number]))!;
      const i = pkg.activities.findIndex((activity) => activity.key === first.activityKey);
      add("RESERVE_LEAK", `/activities/${i}/equivalenceKey`, `La familia reservada ${family} aparece en otro pool u objetivo.`, "Usa una familia exclusiva para cada reserva final o diferida.");
    }
  }

  for (const [i, objective] of pkg.objectives.entries()) {
    const own = pkg.activities.filter((activity) => activity.objectiveKey === objective.key);
    const explanation = own.filter((activity) => activity.kind === "study" && activity.phase === "learn" && isInitialPool(activity));
    const retrieval = own.filter((activity) => activity.phase === "retrieve" && isObjectiveItem(activity) && isInitialPool(activity));
    const elaboration = own.filter((activity) => activity.phase === "elaborate" && activity.kind !== "study" && activity.kind !== "case" && isInitialPool(activity));
    const application = own.filter((activity) => activity.phase === "apply" && isObjectiveItem(activity) && isInitialPool(activity));
    if (!objective.sourceKeys.some((key) => sourceByKey.get(key)?.excerpt.trim()))
      add("REFERENCE_MISSING", `/objectives/${i}/sourceKeys`, "El objetivo no tiene fragmento fuente.", "Vincula una fuente localizable con texto y hash.");
    if (!explanation.length || !retrieval.length || !elaboration.length || !application.length)
      add("OBJECTIVE_COVERAGE", `/objectives/${i}`, `Ciclo incompleto para ${objective.key}: explicación, recuperación, elaboración y aplicación son obligatorias.`, "Añade las fases que faltan con respuesta explícita donde corresponde.");
    const initial = own.filter((activity) => isInitialPool(activity) && isObjectiveItem(activity));
    const initialFamilies = new Set(initial.map((activity) => activity.equivalenceKey));
    const retrievalFamilies = new Set(retrieval.map((activity) => activity.equivalenceKey));
    const applicationFamilies = new Set(application.map((activity) => activity.equivalenceKey));
    if (objective.required) {
      if (initialFamilies.size < 5 || retrievalFamilies.size < 2 || !application.some((activity) => explanation.every((study) => study.representation !== activity.representation)))
        add("BANK_TOO_SMALL", `/objectives/${i}`, `Banco insuficiente para ${objective.key}: requiere cinco familias objetivas, dos de recuperación y aplicación en otra representación.`, "Añade variantes con equivalenceKey distintos y una aplicación de modalidad diferente.");
      const reserves = reserveUses.map((use) => new Set(own.filter((activity) => activity.use === use && isObjectiveItem(activity)).map((activity) => activity.equivalenceKey)));
      if (reserves.some((set) => set.size < 1) || new Set([...initialFamilies, ...reserves.flatMap((set) => [...set])]).size < initialFamilies.size + reserves.reduce((sum, set) => sum + set.size, 0))
        add("RESERVE_LEAK", `/objectives/${i}`, `Faltan reservas disjuntas final, retención7 o retención30 para ${objective.key}.`, "Añade una familia exclusiva para cada evaluación reservada.");
    } else if (!retrievalFamilies.size || !applicationFamilies.size)
      add("OBJECTIVE_COVERAGE", `/objectives/${i}`, `El objetivo opcional ${objective.key} necesita recuperación y aplicación.`, "Añade una actividad objetiva de cada fase.");
    if (objective.criticality === "core") {
      const gate = (assessmentsByKind.get("unit_gate") ?? []).find((assessment) => assessment.afterUnitKey === objective.unitKey && assessment.objectiveKeys.includes(objective.key));
      if (!gate || !gate.candidateActivityKeys.some((key) => {
        const candidate = activityByKey.get(key);
        return candidate?.objectiveKey === objective.key && isObjectiveItem(candidate);
      })) add("CRITICAL_GATE_MISSING", `/objectives/${i}`, `CORE ${objective.key} no tiene comprobación objetiva en su gate.`, "Incluye el objetivo y un ítem objetivo en la evaluación unit_gate de su unidad.");
      for (const [j, misconception] of objective.misconceptions.entries()) {
        if (!misconception.critical) continue;
        const remediation = activityByKey.get(misconception.remediationActivityKey);
        const verification = misconception.verificationActivityKeys.map((key) => activityByKey.get(key)).filter((activity): activity is RouteActivity => Boolean(activity));
        const identifiable = own.some((activity) => isObjectiveItem(activity) && activity.misconceptionMappings.some((mapping) => mapping.misconceptionKey === misconception.key));
        if (!identifiable || !remediation || remediation.objectiveKey !== objective.key || remediation.phase !== "remediate" || !verification.some((activity) => activity.objectiveKey === objective.key && isObjectiveItem(activity) && !reserveUses.includes(activity.use as typeof reserveUses[number])))
          add("CRITICAL_GATE_MISSING", `/objectives/${i}/misconceptions/${j}`, "Error crítico sin respuesta identificable, remediación o verificación objetiva resoluble.", "Mapea una respuesta al error y vincula una actividad remediate y una verificación objetiva del mismo objetivo.");
      }
    }
    if (objective.required) for (const activity of own) if (activity.kind === "constructed_response") {
      const verification = activity.payload.verificationActivityKey ? activityByKey.get(activity.payload.verificationActivityKey) : null;
      if (!verification || verification.objectiveKey !== objective.key || !isObjectiveItem(verification) || !isInitialPool(verification))
        add("OBJECTIVE_COVERAGE", `/activities/${pkg.activities.indexOf(activity)}/payload/verificationActivityKey`, "Una respuesta autorreportada del objetivo requerido carece de verificación objetiva utilizable.", "Vincula una actividad objetiva de aprendizaje o gate del mismo objetivo.");
    }
    if ((pkg.route.discipline === "anatomy" || pkg.route.discipline === "histology") && objective.verb === "identify" && !own.some((activity) => activity.kind === "image_target"))
      add("ASSET_REQUIRED", `/objectives/${i}`, "La identificación espacial requiere una imagen revisada.", "Añade image_target con asset y alternativa accesible.");
  }

  validateAssessmentCoverage(pkg, assessmentsByKind, activityByKey, add);
  validateCases(pkg, activityByKey, add);
  return issues;
}

type AddPublicationIssue = (code: string, path: string, message: string, suggestedFix: string, severity?: "error" | "warning") => void;

function validateAssessmentCoverage(pkg: RoutePackage, byKind: Map<string, RoutePackage["assessments"]>, activityByKey: Map<string, RouteActivity>, add: AddPublicationIssue): void {
  const required = new Set(pkg.objectives.filter((objective) => objective.required).map((objective) => objective.key));
  const candidateOwner = new Map<string, { key: string; kind: string }>();
  for (const [i, assessment] of pkg.assessments.entries()) {
    if (assessment.kind === "diagnostic" && assessment.thresholdPercent !== 80)
      add("OBJECTIVE_COVERAGE", `/assessments/${i}/thresholdPercent`, "El diagnóstico usa 80 solo como campo no operativo.", "Fija thresholdPercent=80 sin usarlo como gate.");
    for (const [j, key] of assessment.candidateActivityKeys.entries()) {
      const previous = candidateOwner.get(key);
      if (previous && (previous.key === assessment.key || ["diagnostic", ...reserveUses].includes(previous.kind) || ["diagnostic", ...reserveUses].includes(assessment.kind)))
        add("RESERVE_LEAK", `/assessments/${i}/candidateActivityKeys/${j}`, `El ítem ${key} ya está en ${previous.key}.`, "Usa un ítem exclusivo para diagnóstico o reserva.");
      else if (!previous) candidateOwner.set(key, { key: assessment.key, kind: assessment.kind });
      const activity = activityByKey.get(key);
      if (!activity) continue;
      const expectedUse = assessment.kind;
      if (expectedUse === "diagnostic" || expectedUse === "final" || expectedUse === "retention7" || expectedUse === "retention30") {
        if (activity.use !== expectedUse) add("RESERVE_LEAK", `/assessments/${i}/candidateActivityKeys/${j}`, `El ítem ${key} pertenece a ${activity.use}, no a ${expectedUse}.`, "Usa un ítem reservado exclusivamente para esta evaluación.");
      } else if (!isInitialPool(activity)) add("RESERVE_LEAK", `/assessments/${i}/candidateActivityKeys/${j}`, `La evaluación reutiliza una reserva ${key}.`, "Selecciona una actividad learning o gate.");
      if (!assessment.objectiveKeys.includes(activity.objectiveKey))
        add("OBJECTIVE_COVERAGE", `/assessments/${i}/candidateActivityKeys/${j}`, `El objetivo de ${key} no está en la evaluación.`, "Incluye su objetivo o retira el ítem.");
    }
  }
  for (const [i, unit] of pkg.units.entries()) {
    const gates = (byKind.get("unit_gate") ?? []).filter((assessment) => assessment.afterUnitKey === unit.key);
    if (!gates.length)
      add("CRITICAL_GATE_MISSING", `/units/${i}`, `La unidad ${unit.key} no tiene gate.`, "Añade un assessment unit_gate después de esta unidad.");
    for (const key of unit.objectiveKeys.filter((objectiveKey) => required.has(objectiveKey))) if (!gates.some((assessment) => assessment.objectiveKeys.includes(key) && assessment.candidateActivityKeys.some((activityKey) => {
      const activity = activityByKey.get(activityKey);
      return activity?.objectiveKey === key && isObjectiveItem(activity);
    }))) add("CRITICAL_GATE_MISSING", `/units/${i}`, `El gate de ${unit.key} no comprueba ${key}.`, "Incluye un ítem objetivo de cada objetivo requerido de la unidad.");
  }
  const expectedCheckpointPositions: number[] = [];
  for (let i = 2; i < pkg.units.length; i += 3) expectedCheckpointPositions.push(i);
  if (pkg.units.length > 1 && pkg.units.length % 3 >= 2) expectedCheckpointPositions.push(pkg.units.length - 1);
  const expectedCheckpoints = new Set(expectedCheckpointPositions.map((i) => pkg.units[i]!.key));
  for (const [segmentIndex, position] of expectedCheckpointPositions.entries()) {
    const key = pkg.units[position]!.key;
    const checkpoint = (byKind.get("checkpoint") ?? []).filter((assessment) => assessment.afterUnitKey === key);
    if (!checkpoint.length) add("OBJECTIVE_COVERAGE", "/assessments", `Falta checkpoint después de ${key}.`, "Añade un checkpoint para el segmento completado.");
    const from = segmentIndex * 3;
    const segmentObjectives = pkg.units.slice(from, position + 1).flatMap((unit) => unit.objectiveKeys).filter((objectiveKey) => required.has(objectiveKey));
    for (const objectiveKey of segmentObjectives) if (!checkpoint.some((assessment) => assessment.objectiveKeys.includes(objectiveKey) && assessment.candidateActivityKeys.some((activityKey) => activityByKey.get(activityKey)?.objectiveKey === objectiveKey)))
      add("OBJECTIVE_COVERAGE", "/assessments", `Checkpoint ${key} omite ${objectiveKey}.`, "Incluye un ítem objetivo de cada objetivo requerido del segmento.");
  }
  for (const [i, assessment] of pkg.assessments.entries()) if (assessment.kind === "checkpoint" && (!assessment.afterUnitKey || !expectedCheckpoints.has(assessment.afterUnitKey)))
    add("OBJECTIVE_COVERAGE", `/assessments/${i}/afterUnitKey`, "Checkpoint fuera de la cadencia de tres unidades.", "Ubícalo tras la tercera unidad o un remanente de dos.");
  for (const kind of reserveUses) {
    const assessments = byKind.get(kind) ?? [];
    if (!assessments.length) add("RESERVE_LEAK", "/assessments", `Falta evaluación ${kind}.`, "Crea la evaluación con ítems reservados exclusivos.");
    for (const key of required) if (!assessments.some((assessment) => assessment.objectiveKeys.includes(key) && assessment.candidateActivityKeys.some((activityKey) => activityByKey.get(activityKey)?.objectiveKey === key)))
      add("RESERVE_LEAK", "/assessments", `La evaluación ${kind} no cubre ${key}.`, "Añade una reserva objetiva de ese objetivo.");
  }
  for (const key of required) if (!pkg.reviewPlan.objectiveKeys.includes(key))
    add("OBJECTIVE_COVERAGE", "/reviewPlan/objectiveKeys", `El plan de repaso omite ${key}.`, "Incluye cada objetivo requerido.");

  const diagnostic = byKind.get("diagnostic") ?? [];
  if (!diagnostic.length) add("OBJECTIVE_COVERAGE", "/assessments", "Falta diagnóstico de orientación.", "Añade un assessment diagnostic de bajo riesgo.");
  const diagnosticItems = diagnostic.flatMap((assessment) => assessment.candidateActivityKeys.map((key) => activityByKey.get(key)).filter((item): item is RouteActivity => Boolean(item)));
  const diagnosticEligible = pkg.objectives.filter((objective) => objective.criticality === "core" && objective.prerequisiteKeys.length === 0);
  if (diagnostic.length) {
    if (diagnosticItems.length > 8 || (pkg.objectives.length >= 4 && diagnosticItems.length < 4) || (pkg.objectives.length < 4 && diagnosticItems.length < diagnosticEligible.length))
      add("OBJECTIVE_COVERAGE", "/assessments", "Diagnóstico fuera de cobertura: requiere 4–8 ítems, o todos los CORE raíz disponibles si hay menos de cuatro objetivos.", "Ajusta el banco diagnóstico de raíces CORE.");
    else if (diagnosticItems.length < 4)
      add("OBJECTIVE_COVERAGE", "/assessments", "Diagnóstico limitado por una ruta con menos de cuatro objetivos.", "Registra esta limitación editorial.", "warning");
    if (pkg.objectives.length < 4 && diagnosticEligible.some((objective) => !diagnosticItems.some((activity) => activity.objectiveKey === objective.key)))
      add("OBJECTIVE_COVERAGE", "/assessments", "El diagnóstico no cubre todos los CORE raíz de esta ruta corta.", "Añade un ítem diagnóstico por cada CORE raíz disponible.");
    for (const activity of diagnosticItems) {
      const objective = pkg.objectives.find((item) => item.key === activity.objectiveKey);
      if (!objective || objective.criticality !== "core" || objective.prerequisiteKeys.length)
        add("OBJECTIVE_COVERAGE", `/activities/${pkg.activities.indexOf(activity)}`, "El diagnóstico debe usar objetivos CORE raíz.", "Sustituye por un ítem de objetivo CORE sin prerrequisitos.");
    }
  }
}

function validateCases(pkg: RoutePackage, activityByKey: Map<string, RouteActivity>, add: AddPublicationIssue): void {
  const childOwner = new Map<string, string>();
  for (const [i, activity] of pkg.activities.entries()) {
    if (activity.kind !== "case") continue;
    const unit = pkg.units.find((candidate) => candidate.activityKeys.includes(activity.key));
    const wrapperPosition = unit?.activityKeys.indexOf(activity.key) ?? -1;
    for (const [stageIndex, stage] of activity.payload.stages.entries()) {
      const child = activityByKey.get(stage.childActivityKey);
      const path = `/activities/${i}/payload/stages/${stageIndex}/childActivityKey`;
      if (!child) continue;
      if (child.kind === "case") add("OBJECTIVE_COVERAGE", path, "Un caso no puede contener otro caso.", "Usa una actividad hija no-case.");
      const previous = childOwner.get(child.key);
      if (previous) add("DUPLICATE_KEY", path, `La actividad hija ${child.key} ya pertenece al caso ${previous}.`, "Usa cada hijo en un solo caso.");
      else childOwner.set(child.key, activity.key);
      if (child.phase !== "remediate" && unit?.activityKeys[wrapperPosition + stageIndex + 1] !== child.key)
        add("OBJECTIVE_COVERAGE", path, "La etapa no está en la secuencia del caso.", "Coloca el hijo inmediatamente después del wrapper y en orden de etapas.");
    }
  }
  for (const [i, assessment] of pkg.assessments.entries()) for (const [j, key] of assessment.candidateActivityKeys.entries()) {
    if (childOwner.has(key) && activityByKey.get(key)?.phase !== "remediate")
      add("OBJECTIVE_COVERAGE", `/assessments/${i}/candidateActivityKeys/${j}`, `El hijo ${key} se lanzaría fuera de su caso.`, "Evalúa el wrapper o usa una variante objetiva independiente.");
  }
}

export type RouteGraphAnalysis = {
  orderedObjectiveKeys: string[];
  cycle: string[] | null;
  issues: RouteValidationIssue[];
};

/** Uses only v2 prerequisiteKeys. Editorial order is a tie-breaker, never a dependency. */
export function analyzeRouteGraph(pkg: RoutePackage): RouteGraphAnalysis {
  const issues: RouteValidationIssue[] = [];
  const add = (code: string, path: string, message: string, suggestedFix: string) => issues.push({ code, severity: "error", path, message, suggestedFix });
  const objectiveIndex = new Map<string, number>();
  const unitIndex = new Map<string, number>();
  const activityIndex = new Map<string, number>();
  const indexUnique = <T extends { key: string }>(items: T[], path: string, index: Map<string, number>) => {
    for (const [i, item] of items.entries()) {
      if (index.has(item.key)) add("DUPLICATE_KEY", `${path}/${i}/key`, `Clave duplicada: ${item.key}.`, "Usa una clave única en esta colección.");
      else index.set(item.key, i);
    }
  };
  indexUnique(pkg.objectives, "/objectives", objectiveIndex);
  indexUnique(pkg.units, "/units", unitIndex);
  indexUnique(pkg.activities, "/activities", activityIndex);

  const objectiveMembership = new Map<string, { unitKey: string; path: string }>();
  const activityMembership = new Map<string, { unitKey: string; path: string }>();
  const editorialRank = new Map<string, [number, number, string]>();
  for (const [unitPosition, unit] of pkg.units.entries()) {
    for (const [position, key] of unit.objectiveKeys.entries()) {
      const path = `/units/${unitPosition}/objectiveKeys/${position}`;
      if (!objectiveIndex.has(key)) add("REFERENCE_MISSING", path, `Objetivo inexistente: ${key}.`, "Vincula un objetivo definido en esta ruta.");
      const first = objectiveMembership.get(key);
      if (first) add("DUPLICATE_KEY", path, `El objetivo ${key} ya pertenece a ${first.unitKey}.`, "Deja el objetivo en una sola unidad.");
      else {
        objectiveMembership.set(key, { unitKey: unit.key, path });
        editorialRank.set(key, [unitPosition, position, key]);
      }
    }
    for (const [position, key] of unit.activityKeys.entries()) {
      const path = `/units/${unitPosition}/activityKeys/${position}`;
      if (!activityIndex.has(key)) add("REFERENCE_MISSING", path, `Actividad inexistente: ${key}.`, "Vincula una actividad definida en esta ruta.");
      const first = activityMembership.get(key);
      if (first) add("DUPLICATE_KEY", path, `La actividad ${key} ya pertenece a ${first.unitKey}.`, "Deja la actividad en una sola unidad.");
      else activityMembership.set(key, { unitKey: unit.key, path });
    }
  }
  for (const [i, objective] of pkg.objectives.entries()) {
    if (!unitIndex.has(objective.unitKey)) add("REFERENCE_MISSING", `/objectives/${i}/unitKey`, `Unidad inexistente: ${objective.unitKey}.`, "Asigna una unidad existente.");
    const member = objectiveMembership.get(objective.key);
    if (!member) add("REFERENCE_MISSING", `/objectives/${i}/unitKey`, `El objetivo ${objective.key} no aparece en ninguna unidad.`, "Inclúyelo exactamente una vez en objectiveKeys.");
    else if (member.unitKey !== objective.unitKey) add("REFERENCE_MISSING", `/objectives/${i}/unitKey`, `El objetivo ${objective.key} declara ${objective.unitKey}, pero aparece en ${member.unitKey}.`, "Haz coincidir unitKey y objectiveKeys.");
    for (const [j, key] of objective.prerequisiteKeys.entries()) {
      const path = `/objectives/${i}/prerequisiteKeys/${j}`;
      if (!objectiveIndex.has(key)) add("REFERENCE_MISSING", path, `Prerrequisito inexistente: ${key}.`, "Vincula un objetivo de esta ruta.");
      if (objective.prerequisiteKeys.indexOf(key) !== j) add("DUPLICATE_KEY", path, `Prerrequisito repetido: ${key}.`, "Conserva una sola arista entre los objetivos.");
    }
  }
  for (const [i, activity] of pkg.activities.entries()) {
    if (!objectiveIndex.has(activity.objectiveKey)) add("REFERENCE_MISSING", `/activities/${i}/objectiveKey`, `Objetivo principal inexistente: ${activity.objectiveKey}.`, "Vincula un objetivo de esta ruta.");
    for (const [j, key] of activity.relatedObjectiveKeys.entries()) {
      if (!objectiveIndex.has(key)) add("REFERENCE_MISSING", `/activities/${i}/relatedObjectiveKeys/${j}`, `Objetivo relacionado inexistente: ${key}.`, "Vincula un objetivo de esta ruta.");
    }
    const member = activityMembership.get(activity.key);
    if (!member) add("REFERENCE_MISSING", `/activities/${i}/key`, `La actividad ${activity.key} no aparece en ninguna unidad.`, "Inclúyela exactamente una vez en activityKeys.");
    const objective = pkg.objectives[objectiveIndex.get(activity.objectiveKey) ?? -1];
    if (member && objective && member.unitKey !== objective.unitKey) add("REFERENCE_MISSING", `/activities/${i}/objectiveKey`, `La actividad ${activity.key} está en ${member.unitKey}, pero su objetivo principal está en ${objective.unitKey}.`, "Ubica actividad y objetivo principal en la misma unidad.");
  }

  const rank = (key: string): [number, number, string] => editorialRank.get(key) ?? [Number.MAX_SAFE_INTEGER, objectiveIndex.get(key) ?? Number.MAX_SAFE_INTEGER, key];
  const compare = (a: string, b: string) => {
    const left = rank(a), right = rank(b);
    return left[0] - right[0] || left[1] - right[1] || (left[2] < right[2] ? -1 : left[2] > right[2] ? 1 : 0);
  };
  const indegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  for (const key of objectiveIndex.keys()) {
    indegree.set(key, 0);
    dependents.set(key, []);
  }
  for (const [i, objective] of pkg.objectives.entries()) {
    if (objectiveIndex.get(objective.key) !== i) continue;
    for (const key of new Set(objective.prerequisiteKeys)) {
      if (!objectiveIndex.has(key)) continue;
      indegree.set(objective.key, (indegree.get(objective.key) ?? 0) + 1);
      dependents.get(key)!.push(objective.key);
    }
  }
  for (const values of dependents.values()) values.sort(compare);
  const ready = [...indegree].filter(([, degree]) => degree === 0).map(([key]) => key).sort(compare);
  const orderedObjectiveKeys: string[] = [];
  while (ready.length) {
    const key = ready.shift()!;
    orderedObjectiveKeys.push(key);
    for (const child of dependents.get(key) ?? []) {
      const degree = (indegree.get(child) ?? 0) - 1;
      indegree.set(child, degree);
      if (degree === 0) {
        ready.push(child);
        ready.sort(compare);
      }
    }
  }
  const unresolved = new Set([...indegree].filter(([, degree]) => degree > 0).map(([key]) => key));
  const cycle = findCycle(unresolved, dependents, compare);
  if (cycle) {
    const from = cycle[cycle.length - 2]!;
    const to = cycle[cycle.length - 1]!;
    const i = objectiveIndex.get(to)!;
    const j = pkg.objectives[i]!.prerequisiteKeys.indexOf(from);
    const path = `/objectives/${i}/prerequisiteKeys/${j}`;
    add("DAG_CYCLE", path, `Ciclo de dependencias: ${cycle.join(" → ")}.`, "Elimina una arista del ciclo antes de publicar.");
  }
  return { orderedObjectiveKeys, cycle, issues };
}

function findCycle(unresolved: Set<string>, dependents: Map<string, string[]>, compare: (a: string, b: string) => number): string[] | null {
  const state = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];
  const visit = (key: string): string[] | null => {
    state.set(key, 1);
    stack.push(key);
    for (const child of dependents.get(key) ?? []) {
      if (!unresolved.has(child)) continue;
      if (state.get(child) === 1) return [...stack.slice(stack.indexOf(child)), child];
      if (!state.has(child)) {
        const cycle = visit(child);
        if (cycle) return cycle;
      }
    }
    stack.pop();
    state.set(key, 2);
    return null;
  };
  for (const key of [...unresolved].sort(compare)) {
    if (state.has(key)) continue;
    const cycle = visit(key);
    if (cycle) return cycle;
  }
  return null;
}

/** An unfinished branch does not block a different root or an independent branch. */
export function availableObjectiveKeys(pkg: RoutePackage, completedKeys: ReadonlySet<string>): string[] {
  const graph = analyzeRouteGraph(pkg);
  if (graph.issues.length) return [];
  const byKey = new Map(pkg.objectives.map((objective) => [objective.key, objective]));
  return graph.orderedObjectiveKeys.filter((key) => !completedKeys.has(key) && byKey.get(key)!.prerequisiteKeys.every((parent) => completedKeys.has(parent)));
}

function validPolygon(points: { x: number; y: number }[]): boolean {
  if (new Set(points.map((point) => `${point.x},${point.y}`)).size < 3) return false;
  const cross = (a: typeof points[number], b: typeof points[number], c: typeof points[number]) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const area = points.reduce((sum, point, i) => {
    const next = points[(i + 1) % points.length]!;
    return sum + point.x * next.y - next.x * point.y;
  }, 0);
  if (Math.abs(area) < 1e-12) return false;
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) {
    if ((j === i + 1) || (i === 0 && j === points.length - 1)) continue;
    const a = points[i]!, b = points[(i + 1) % points.length]!, c = points[j]!, d = points[(j + 1) % points.length]!;
    if (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0) return false;
  }
  return true;
}

export function routePackageJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(RoutePackageSchema, { target: "draft-2020-12", unrepresentable: "any" }) as Record<string, unknown>;
}
