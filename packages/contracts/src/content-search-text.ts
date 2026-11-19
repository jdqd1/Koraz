function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
const text = (value: unknown) => typeof value === "string" ? value : "";
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

/** Only reader-visible text. Never traverse arbitrary attributes, marks, IDs or URLs. */
export function richDocumentSearchText(value: unknown): string {
  const node = record(value);
  return [text(node.text), ...list(node.content).map(richDocumentSearchText)].filter(Boolean).join(" ");
}
function guideText(value: unknown) {
  const guide = record(value);
  return richDocumentSearchText(guide.document) || list(guide.sections).map(value => {
    const section = record(value);
    return [text(section.heading), text(section.body)].filter(Boolean).join(". ");
  }).join("\n\n");
}
function questionsText(value: unknown) {
  return list(value).map(value => {
    const question = record(value);
    return [text(question.prompt), ...list(question.options).map(text), text(question.explanation)].filter(Boolean).join(" ");
  }).join("\n");
}
export function publishedContentSearchText(kind: string, value: unknown): string {
  const content = record(value);
  if (kind === "guide" || kind === "video") return [
    kind === "video" ? text(content.description) : "",
    guideText(kind === "video" ? content.guide : content),
    list(content.keyPoints).map(text).join("\n"),
    questionsText(record(content.quiz).questions),
  ].filter(Boolean).join("\n\n");
  if (kind === "quiz") return questionsText(content.questions);
  if (kind === "flashcards") return list(content.cards).map(value => {
    const card = record(value);
    return `${text(card.front)}. ${text(card.back)}`;
  }).join("\n\n");
  return [text(content.introduction), list(content.objectives).map(text).join("\n")].filter(Boolean).join("\n\n");
}
