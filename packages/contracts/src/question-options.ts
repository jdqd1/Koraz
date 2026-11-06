export function firstDuplicateOptionIndex(options: readonly string[]) {
  const seen = new Set<string>();
  return options.findIndex(text => {
    // Preserve case, units and superscripts. Only canonical Unicode and spacing are equivalent.
    const normalized = text.normalize("NFC").trim().replace(/\s+/gu, " ");
    if (seen.has(normalized)) return true;
    seen.add(normalized);
    return false;
  });
}

export function hasDuplicateOptionText(options: readonly string[]) {
  return firstDuplicateOptionIndex(options) >= 0;
}

// Match entire placeholder phrases so legitimate mentions of a clinical test remain valid.
export function isEditorialPlaceholder(text: string) {
  return /^(?:dasdasd|(?:texto|pregunta|enunciado|explicación|respuesta) de prueba)[.!]?$/iu.test(
    text.normalize("NFC").trim().replace(/\s+/gu, " "),
  );
}
