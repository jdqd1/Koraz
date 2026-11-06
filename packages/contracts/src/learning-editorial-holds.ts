// shortcut: four immutable Peritoneo v3 option IDs, move to editorial storage if another revision needs a hold.
export const heldLearningOptionIds: readonly string[] = [
  "6746bef4-8367-4319-83c5-2991de156b35",
  "aabf0756-45c2-4873-a635-69b5acd58f71",
  "398b826d-f88a-4ca4-a0e4-dee888f0e430",
  "1c345f03-d340-4ab1-a96e-bb783ea1e586",
];

export function learningOptionUnderReview(optionId: string | null) {
  return optionId !== null && heldLearningOptionIds.includes(optionId);
}
