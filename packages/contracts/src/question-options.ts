export function hasDuplicateOptionText(options: readonly string[]) {
  // Preserve case, units and superscripts. Only canonical Unicode and spacing are equivalent.
  const normalized = options.map((text) => text.normalize("NFC").trim().replace(/\s+/gu, " "));
  return new Set(normalized).size !== normalized.length;
}
