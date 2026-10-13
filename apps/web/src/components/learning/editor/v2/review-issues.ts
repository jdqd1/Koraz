import type { RoutePackage } from "@cediah/contracts";

type Issue = { code: string; path: string; message: string; suggestedFix: string; severity: "error" | "warning" };
export type ReviewTaskV2 = { title: string; detail: string; action: string; path: string; context: string; group: string };
type Copy = Pick<ReviewTaskV2, "title" | "detail">;

const commonCopy: Record<string, Copy> = {
  SCHEMA_UNSUPPORTED: { title: "Actualiza el archivo de la ruta", detail: "Este archivo utiliza un formato que el editor no puede abrir. Exporta una copia compatible e impórtala de nuevo." },
  SCHEMA_INVALID: { title: "Completa o corrige este dato", detail: "Revisa el campo marcado y completa la información solicitada." },
  DUPLICATE_KEY: { title: "Hay un elemento repetido", detail: "Revisa el elemento indicado. Cada objetivo, actividad o pregunta debe tener su propio lugar en la ruta." },
  REFERENCE_MISSING: { title: "Revisa el contenido vinculado", detail: "Selecciona un elemento que exista en esta ruta o retira el vínculo que ya no se utiliza." },
  DAG_CYCLE: { title: "Ajusta los requisitos previos", detail: "Hay objetivos que se necesitan mutuamente para comenzar. Retira uno de esos requisitos para que el estudiante tenga un punto de inicio." },
  OBJECTIVE_COVERAGE: { title: "Completa este paso del aprendizaje", detail: "Revisa las actividades y las preguntas que acompañan a este objetivo." },
  BANK_TOO_SMALL: { title: "Añade más preguntas distintas", detail: "Prepara al menos 5 preguntas diferentes: incluye 2 de memoria y una de aplicación en un formato distinto al de la lectura. Las variantes de una misma pregunta cuentan como una sola." },
  RESERVE_LEAK: { title: "Separa las preguntas de cada evaluación", detail: "La evaluación final y los repasos a 7 y 30 días necesitan preguntas propias, sin reutilizar las de práctica ni sus variantes." },
  CRITICAL_GATE_MISSING: { title: "Comprueba lo aprendido en la unidad", detail: "Añade una Comprobación de unidad y una pregunta con corrección objetiva para cada objetivo obligatorio de esa unidad." },
  SOURCE_UNRESOLVED: { title: "Completa la fuente de estudio", detail: "Añade la referencia, el fragmento utilizado y su sección o página. Comprueba que el material esté revisado." },
  SOURCE_CHANGED: { title: "Una fuente se ha actualizado", detail: "Revisa el material vinculado y comprueba que las actividades sigan correspondiendo a la versión actual." },
  ASSET_REQUIRED: { title: "Completa el recurso visual", detail: "Vincula la imagen y revisa su descripción, dimensiones y alternativa de texto antes de publicar." },
  ASSET_RIGHTS: { title: "Revisa el permiso de uso del archivo", detail: "Indica quién es el propietario o qué licencia permite usarlo. Añade el crédito cuando corresponda." },
  ANSWER_INVALID: { title: "Revisa la respuesta configurada", detail: "Comprueba que la respuesta correcta y las opciones correspondan a la pregunta." },
  REVIEW_STALE: { title: "Solicita una nueva revisión", detail: "El contenido cambió después de aprobarse. Guarda los cambios y envía la versión actual a revisión antes de publicarla." },
  VERSION_CONFLICT: { title: "La ruta cambió en otra sesión", detail: "Conserva una copia de tus cambios y abre la versión guardada para continuar." },
  IDEMPOTENCY_CONFLICT: { title: "Comprueba el resultado antes de repetir", detail: "Puede haber una acción anterior pendiente. Abre la versión guardada antes de volver a intentarlo." },
  ACCESS_REVOKED: { title: "Revisa tu acceso al contenido", detail: "Tu cuenta ya no tiene acceso a uno de los materiales. Comprueba tus permisos o selecciona otro recurso autorizado." },
  ENGINE_VERSION_MISMATCH: { title: "Abre esta ruta en su editor correspondiente", detail: "Esta ruta usa otra versión del sistema de aprendizaje. Regresa a la lista de rutas para abrirla." },
  engine_version_mismatch: { title: "Abre esta ruta en su editor correspondiente", detail: "Esta ruta usa otra versión del sistema de aprendizaje. Regresa a la lista de rutas para abrirla." },
  VALIDATION_PENDING: { title: "Falta comprobar la ruta", detail: "Guarda los cambios y pulsa Comprobar ruta para revisar el contenido, las fuentes y los permisos." },
  CONVERSION_REVIEW: { title: "Revisa la ruta adaptada", detail: "Comprueba el contenido de la nueva versión y solicita su revisión antes de publicarla." },
  CONVERSION_DEPENDENCIES: { title: "Revisa los requisitos previos", detail: "Confirma qué objetivos debe completar el estudiante antes de avanzar a los siguientes." },
  CONVERSION_PEDAGOGY: { title: "Completa las actividades de aprendizaje", detail: "Añade las actividades que faltan para comprender, recordar, relacionar y aplicar el contenido." },
  CONVERSION_RESERVES: { title: "Prepara las preguntas de evaluación", detail: "Añade preguntas exclusivas para la evaluación final y los repasos a 7 y 30 días." },
  CONVERSION_OBJECTIVE_MISSING: { title: "Añade el objetivo que falta", detail: "Vincula el contenido a un objetivo de aprendizaje antes de continuar." },
  CONVERSION_RESOURCE_MISSING: { title: "Vuelve a vincular el material", detail: "Selecciona el recurso que corresponde a esta actividad." },
  CONVERSION_SOURCES: { title: "Revisa las fuentes de la nueva versión", detail: "Vincula los materiales utilizados y comprueba que sus referencias estén completas." },
};

const fieldCopy: Record<string, Copy> = {
  prompt: { title: "Revisa la consigna", detail: "Escribe la pregunta o instrucción que verá el estudiante, con un máximo de 4000 caracteres." },
  body: { title: "Completa la lectura", detail: "Añade el texto que debe estudiar el alumno, con un máximo de 10 000 caracteres." },
  modelAnswer: { title: "Completa la respuesta modelo", detail: "Escribe la respuesta que servirá para corregir o comparar el intento del estudiante." },
  explanation: { title: "Explica la respuesta", detail: "Añade una explicación que ayude a entender por qué la respuesta es correcta." },
  distractorFeedback: { title: "Explica las opciones incorrectas", detail: "Añade una explicación para cada opción incorrecta. Así el estudiante podrá entender y corregir su error." },
  acceptedAnswers: { title: "Revisa las respuestas aceptadas", detail: "Define las variantes válidas de la respuesta y comprueba que respeten el límite de caracteres." },
  correctKey: { title: "Selecciona la respuesta correcta", detail: "Elige una de las opciones que aparecen en esta pregunta." },
  correctByPrompt: { title: "Completa las relaciones correctas", detail: "Asigna una opción válida a cada enunciado." },
  allowReuse: { title: "Revisa las opciones repetidas", detail: "Usa una opción distinta para cada relación o activa Permitir reutilizar una opción." },
  correctLabelByTarget: { title: "Revisa las etiquetas de la imagen", detail: "En Etiquetar zonas, asigna una etiqueta a cada zona. En Señalar una zona, retira las etiquetas de respuesta." },
  polygon: { title: "Ajusta la zona de la imagen", detail: "Dibuja una zona cerrada con al menos 3 puntos distintos, sin cruzar sus bordes." },
  acceptedOrders: { title: "Revisa el orden de los pasos", detail: "Cada orden aceptado debe incluir todos los pasos, una sola vez." },
  focusSpans: { title: "Vuelve a ubicar el fragmento destacado", detail: "Selecciona un fragmento que exista dentro del texto de estudio." },
  videoRange: { title: "Ajusta el fragmento de video", detail: "Elige un final posterior al inicio del fragmento." },
  rubric: { title: "Completa los criterios de comparación", detail: "Indica qué debe incluir una buena respuesta y añade un ejemplo para cada criterio." },
  thresholdRationale: { title: "Explica el criterio de aprobación", detail: "Describe por qué elegiste este porcentaje para aprobar, con entre 40 y 2000 caracteres." },
  title: { title: "Revisa el nombre", detail: "Escribe un nombre claro para identificar este contenido." },
  summary: { title: "Completa la descripción de la ruta", detail: "Describe qué aprenderá el estudiante al completar el recorrido." },
};

/** Presentation only: validator codes, severity and the package are never changed. */
export function reviewTaskV2(issue: Issue, pkg: RoutePackage): ReviewTaskV2 {
  const parts = issue.path.startsWith("/") ? issue.path.slice(1).split("/").map(part => part.replace(/~1/g, "/").replace(/~0/g, "~")) : issue.path.replace(/^package\./, "").split(".");
  const owner = parts[0];
  const index = Number(parts[1]);
  const objective = owner === "objectives" ? pkg.objectives[index] : undefined;
  const activity = owner === "activities" ? pkg.activities[index] : undefined;
  const unit = owner === "units" ? pkg.units[index] : undefined;
  const source = owner === "sources" ? pkg.sources[index] : undefined;
  const asset = owner === "assets" ? pkg.assets[index] : undefined;
  const task: ReviewTaskV2 = {
    ...(commonCopy[issue.code] ?? { title: "Revisa este dato de la ruta", detail: "Abre el elemento indicado y comprueba su contenido antes de continuar." }),
    path: issue.path,
    group: owner === "activities" ? "Actividades" : owner === "assessments" || owner === "reviewPlan" ? "Evaluación y repaso" : owner === "sources" || owner === "assets" || owner === "bindings" ? "Fuentes y archivos" : owner === "objectives" || owner === "units" ? "Objetivos y unidades" : "Revisión",
    action: owner === "activities" ? "Editar actividad" : owner === "objectives" ? "Revisar objetivo" : owner === "units" ? "Revisar unidad" : owner === "sources" ? "Completar fuente" : owner === "assets" ? "Revisar archivo" : owner === "assessments" || owner === "reviewPlan" ? "Revisar evaluación" : "Revisar contenido",
    context: objective ? `Objetivo: ${objective.title || "Sin título"}` : activity ? `Actividad: ${activity.prompt || "Sin consigna"}` : unit ? `Unidad: ${unit.title || "Sin título"}` : source ? `Fuente: ${source.title || "Sin nombre"}` : asset ? `Archivo: ${asset.originalFileName}` : "",
  };
  const copy = (title: string, detail: string) => Object.assign(task, { title, detail });
  const activities = () => Object.assign(task, { group: "Actividades", action: "Abrir actividades", path: "activity.new" });
  const assessments = () => {
    const gateIndex = pkg.assessments.findIndex(item => item.kind === "unit_gate" && item.afterUnitKey === (objective?.unitKey ?? unit?.key));
    Object.assign(task, { group: "Evaluación y repaso", action: "Configurar evaluación", path: owner === "assessments" && pkg.assessments[index] ? issue.path : gateIndex >= 0 && issue.code === "CRITICAL_GATE_MISSING" ? `/assessments/${gateIndex}/objectiveKeys` : "assessment.newKind" });
  };

  if (issue.code === "SCHEMA_INVALID") {
    const field = [...parts].reverse().find(part => fieldCopy[part]);
    if (field) Object.assign(task, fieldCopy[field]);
  }
  if (issue.code === "BANK_TOO_SMALL") activities();
  if (issue.code === "RESERVE_LEAK") {
    if (objective) { copy("Prepara las preguntas del final y los repasos", "Añade una pregunta distinta y exclusiva para cada evaluación: final, repaso a 7 días y repaso a 30 días. No reutilices las preguntas de práctica ni sus variantes."); activities(); }
    else if (activity) { task.action = "Ajustar pregunta"; task.path = `/activities/${index}/equivalenceKey`; }
    else {
      assessments();
      if (/Falta evaluación/.test(issue.message)) copy("Añade la evaluación que falta", `Crea ${issue.message.includes("retention7") ? "el repaso a 7 días" : issue.message.includes("retention30") ? "el repaso a 30 días" : "la evaluación final"} y selecciona sus preguntas exclusivas.`);
    }
  }
  if (issue.code === "CRITICAL_GATE_MISSING") {
    if (parts.includes("misconceptions")) copy("Ayuda a corregir este error frecuente", "Vincula una pregunta que detecte el error, una actividad para reforzar el contenido y otra pregunta que compruebe lo aprendido.");
    else assessments();
  }
  if (issue.code === "OBJECTIVE_COVERAGE") {
    if (parts.includes("verificationActivityKey")) copy("Añade una pregunta de comprobación", "Vincula una pregunta con corrección objetiva del mismo objetivo, usada en la práctica o en la comprobación de unidad. La autoevaluación de una tarjeta necesita este complemento.");
    else if (parts.includes("stages")) copy("Revisa las etapas del caso", /secuencia/.test(issue.message) ? "Las preguntas deben aparecer justo después del caso y en el mismo orden que sus etapas. Revisa las actividades vinculadas a cada etapa." : "Cada etapa necesita una pregunta propia. Selecciona actividades distintas y evita incluir un caso dentro de otro.");
    else if (owner === "reviewPlan") { copy("Incluye los objetivos en el repaso", "Selecciona todos los objetivos obligatorios para que el estudiante pueda repasarlos después de completar la ruta."); task.action = "Configurar repaso"; }
    else if (objective) {
      copy("Completa el recorrido de este objetivo", "Incluye una lectura, una pregunta de memoria, una actividad para relacionar o explicar y una pregunta de aplicación."); activities();
    }
    else if (owner === "objectives") copy("Define qué debe aprender el estudiante", "Añade al menos una unidad y un objetivo de prioridad Esencial marcado como obligatorio.");
    else if (owner === "editorial") { copy("Resuelve las observaciones de revisión", "Revisa las observaciones abiertas y completa los cambios solicitados antes de publicar."); task.path = "package.editorial.notes"; }
    else if (/diagnóstico/i.test(issue.message)) {
      assessments();
      copy("Revisa la evaluación inicial", issue.severity === "warning" ? "Esta ruta tiene menos de 4 objetivos y su evaluación inicial es más corta. Indica esta limitación en las notas de revisión." : "El diagnóstico debe evaluar los objetivos esenciales que no tienen requisitos previos: entre 4 y 8 preguntas, o todos los objetivos disponibles si la ruta tiene menos de 4.");
      if (issue.severity === "warning") { task.path = "review.note"; task.action = "Añadir nota"; }
      if (activity) { task.path = `/activities/${index}/objectiveKey`; task.action = "Revisar objetivo de la pregunta"; }
    }
    else if (/checkpoint/i.test(issue.message)) { assessments(); copy("Revisa la comprobación acumulativa", "Comprueba los objetivos obligatorios al terminar cada bloque de 3 unidades, y también el último bloque si quedan 2 unidades."); }
    else if (parts.includes("candidateActivityKeys")) copy("Revisa las preguntas de la evaluación", "Incluye el objetivo de cada pregunta seleccionada. Las preguntas de un caso deben mantenerse dentro de su caso; usa una pregunta independiente para esta evaluación.");
    else if (activity) copy("Completa el contenido de la actividad", "Sustituye los textos pendientes por una consigna y una explicación listas para el estudiante.");
  }
  if (issue.code === "ASSET_REQUIRED" && objective) { copy("Añade una actividad con imagen", "Para identificar estructuras, añade una imagen revisada que el estudiante pueda señalar o etiquetar, junto con una alternativa de texto."); activities(); }
  if (issue.code === "REFERENCE_MISSING") {
    if (parts.includes("sourceKeys")) copy(parts.includes("feedback") ? "Vincula la fuente de la explicación" : "Vincula una fuente de estudio", "Selecciona al menos una fuente e incluye el fragmento, la sección o la página que respalda este contenido.");
    else if (parts.includes("assetKey")) copy("Selecciona el recurso de la actividad", "Vincula una imagen o un archivo disponible en la ruta.");
    else if (parts.includes("accessibleAlternativeKey")) copy("Añade otra forma de responder", "Vincula una actividad de texto o tabla para quien no pueda responder directamente sobre la imagen.");
    else if (parts.includes("unitKey")) copy("Asigna el objetivo a una unidad", "Selecciona una unidad existente y comprueba que el objetivo aparezca solo en ella.");
    else if (parts.includes("objectiveKey")) copy("Selecciona el objetivo de la actividad", "Vincula un objetivo existente. La actividad y su objetivo deben pertenecer a la misma unidad.");
    else if (parts.includes("prerequisiteKeys")) copy("Revisa los requisitos previos", "Selecciona objetivos que existan en esta ruta o retira los vínculos que ya no se utilizan.");
  }
  if (issue.code === "SOURCE_UNRESOLVED" && parts.includes("citation")) copy("Completa la referencia bibliográfica", "Indica el título, los autores y un enlace o DOI que permita encontrar el material.");
  if (issue.code === "REVIEW_STALE" || issue.code === "VALIDATION_PENDING") { task.path = "review.note"; task.action = "Abrir revisión"; }
  return task;
}
