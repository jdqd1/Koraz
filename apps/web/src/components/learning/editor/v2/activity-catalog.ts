import type { RouteActivity } from "@cediah/contracts";
import type { ActivityPresetV2 } from "./activity-model";

export const activityCatalogV2: Record<ActivityPresetV2, { purpose: string; when: string; count: number }> = {
  study: { purpose: "Presenta una lectura, explicación o ejemplo antes de practicar.", when: "Úsala para introducir un concepto o mostrar un ejemplo resuelto. La lectura no comprueba dominio.", count: 1 },
  single_choice: { purpose: "El estudiante elige una respuesta entre varias opciones.", when: "Úsala para distinguir conceptos y detectar errores frecuentes con una corrección objetiva.", count: 1 },
  short_answer: { purpose: "Pide recordar una respuesta breve, sin opciones que den pistas.", when: "Úsala para nombres, términos o datos concretos. Define las variantes válidas de la respuesta.", count: 1 },
  constructed_response: { purpose: "Pide explicar con palabras propias y comparar con una respuesta modelo.", when: "Úsala para razonamientos y explicaciones. Añade criterios y una verificación objetiva cuando el objetivo lo requiera.", count: 1 },
  card: { purpose: "Presenta una pregunta y permite revelar su respuesta después de intentar recordarla.", when: "Úsala para recuperación y repaso. El estudiante escribe antes de ver el reverso y valorar su respuesta.", count: 1 },
  match: { purpose: "Relaciona elementos de dos conjuntos.", when: "Úsala para asociar estructuras, funciones, términos o categorías.", count: 1 },
  image_target: { purpose: "Pide señalar una zona o asignar etiquetas sobre una imagen.", when: "Úsala para reconocimiento visual y localización. Necesita una imagen revisada, zonas y una alternativa de texto.", count: 1 },
  sequence: { purpose: "El estudiante ordena los pasos de un proceso.", when: "Úsala para trayectos, etapas y procedimientos donde el orden importa.", count: 1 },
  case: { purpose: "Presenta una situación por etapas, con una pregunta en cada una.", when: "Úsala para aplicar conocimientos con información progresiva. Vincula una actividad a cada etapa.", count: 1 },
  comparison: { purpose: "Presenta relaciones en una tabla de comparación.", when: "Úsala para contrastar características de conceptos que suelen confundirse.", count: 1 },
  causal_map: { purpose: "Pide completar relaciones entre conceptos en forma de mapa.", when: "Úsala para conectar causas, efectos y funciones. Define las relaciones correctas en la solución.", count: 1 },
  mechanism: { purpose: "Combina ordenar un proceso con explicar por qué ocurre.", when: "Úsala cuando recordar la secuencia y explicar el mecanismo son partes del mismo aprendizaje. Crea dos actividades vinculadas.", count: 2 },
  error: { purpose: "Combina detectar un error con explicar cómo corregirlo.", when: "Úsala para trabajar errores frecuentes. Crea un caso y dos preguntas vinculadas.", count: 3 },
};

export const activityPresetGroupsV2: { label: string; presets: ActivityPresetV2[] }[] = [
  { label: "Estudio", presets: ["study"] },
  { label: "Preguntas", presets: ["single_choice", "short_answer", "constructed_response", "card"] },
  { label: "Visuales y casos", presets: ["match", "image_target", "sequence", "case", "comparison", "causal_map"] },
  { label: "Actividades guiadas", presets: ["mechanism", "error"] },
];

// Examples belong only to the picker. Creation always uses the existing empty presets.
export function activityExampleV2(preset: ActivityPresetV2): RouteActivity[] {
  const base = { key: "example", objectiveKey: "example-objective", relatedObjectiveKeys: [], phase: "retrieve" as const,
    required: true, sourceKeys: [], representation: "text" as const, equivalenceKey: "example-family", hints: [], use: "learning" as const,
    prompt: "", feedback: { explanation: "Recuperar de memoria permite comprobar qué recuerdas antes de volver a leer.", commonError: "", sourceKeys: [] }, misconceptionMappings: [], alternativeActivityKey: null };
  const choice: RouteActivity = { ...base, key: "example-choice", kind: "single_choice", prompt: "¿Qué acción te ayuda a comprobar qué recuerdas?", payload: { options: [{ key: "a", text: "Responder sin consultar la guía" }, { key: "b", text: "Volver a leer antes de responder" }], correctKey: "a", distractorFeedback: { b: "Primero intenta recuperar la respuesta." } } };
  const constructed: RouteActivity = { ...base, key: "example-constructed", kind: "constructed_response", prompt: preset === "card" ? "¿Qué significa recuperar un conocimiento de memoria?" : "Explica cómo combinarías lectura y práctica en una sesión de estudio.", payload: { modelAnswer: preset === "card" ? "Recordar una idea e intentar responder sin consultar el material. Después puedes comparar con el modelo y corregir errores." : "Primero lee para comprender. Después responde sin consultar el material y revisa la explicación para corregir errores.", rubric: [{ key: "criterion", criterion: "Incluye un intento sin consultar el material", example: "Responder una pregunta antes de volver a leer." }], verificationActivityKey: "example-choice" } };
  const sequence: RouteActivity = { ...base, kind: "sequence", prompt: "Ordena los pasos de una sesión de estudio.", payload: { items: [{ key: "review", text: "Revisar la explicación" }, { key: "read", text: "Leer para comprender" }, { key: "answer", text: "Responder de memoria" }], acceptedOrders: [["read", "answer", "review"]], whyActivityKey: preset === "mechanism" ? constructed.key : null } };
  switch (preset) {
    case "study": return [{ ...base, kind: "study", phase: "learn", prompt: "Lee antes de comenzar la práctica.", payload: { body: "Estudiar combina comprensión y práctica.\n\nLee una sección de la guía, intenta responder de memoria y revisa después la explicación. Así puedes identificar qué necesitas volver a practicar.", focusSpans: [{ start: 0, end: 40 }], assetKey: null, scaffold: "explanation", videoRange: null } }];
    case "single_choice": return [choice];
    case "short_answer": return [{ ...base, kind: "short_answer", prompt: "¿Cómo se llama el material de preguntas con anverso y reverso?", payload: { acceptedAnswers: ["tarjeta", "flashcard"], maxChars: 100, modelAnswer: "Tarjeta o flashcard", normalization: "nfkc-lower-space" } }];
    case "card": case "constructed_response": return [constructed];
    case "match": case "comparison": case "causal_map": return [{ ...base, kind: "match", prompt: "Relaciona cada material con su uso.", payload: { presentation: preset === "comparison" ? "comparison_table" : preset === "causal_map" ? "causal_map" : "pairs", prompts: [{ key: "guide", text: "Guía de estudio" }, { key: "card", text: "Tarjeta" }], choices: [{ key: "understand", text: "Comprender un tema" }, { key: "recall", text: "Recuperar de memoria" }], correctByPrompt: { guide: "understand", card: "recall" }, allowReuse: false, edges: [] } }];
    case "image_target": return [{ ...base, kind: "image_target", representation: "image", prompt: "Señala una zona sobre la imagen de ejemplo.", payload: { assetKey: "example-image", mode: "hotspot", targets: [{ key: "zone", prompt: "Señala una zona", polygon: [], label: "" }], labels: [], correctLabelByTarget: {}, accessibleAlternativeKey: choice.key, masking: "no_labels" } }];
    case "sequence": return [sequence];
    case "mechanism": return [sequence, constructed];
    case "case": case "error": return [{ ...base, kind: "case", representation: "case", prompt: preset === "error" ? "Detecta el error y propón una corrección." : "Ayuda a organizar una sesión de estudio.", payload: { stages: [{ key: "first", narrative: "Una estudiante vuelve a leer la guía y siente que recuerda todo, pero aún no ha intentado responder sin verla.", childActivityKey: choice.key }, { key: "second", narrative: "Ahora quiere comprobar lo que recuerda y decidir qué necesita repasar.", childActivityKey: constructed.key }] } }, choice, constructed];
  }
}
