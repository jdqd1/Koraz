import { describe, expect, it } from "vitest";
import { horizontalLevelLayout } from "./map-horizontal-layout";

describe("horizontal level layout", () => {
  for (const width of [320, 390, 767, 1024, 1440]) {
    for (const count of [1, 3, 6, 8, 100]) {
      it(`centers the origin across ${count} cards at ${width}px without overlaps`, () => {
        const ids = Array.from({ length: count }, (_, index) => `item-${index}`);
        const layout = horizontalLevelLayout(ids, width, 600, width < 768);
        const cards = ids.map((id) => layout.positions[id]!);
        const sourceCenter = layout.origin.y + layout.originHeight / 2;
        const firstCenter = cards[0]!.y + layout.cardHeight / 2;
        const lastCenter = cards.at(-1)!.y + layout.cardHeight / 2;
        expect(sourceCenter).toBe((firstCenter + lastCenter) / 2);
        for (let index = 0; index < cards.length; index++) {
          const card = cards[index]!;
          expect(card.x).toBeGreaterThan(layout.origin.x + layout.originWidth);
          expect(card.x + layout.cardWidth).toBeLessThanOrEqual(layout.contentWidth);
          expect(card.y + layout.cardHeight).toBeLessThan(layout.contentHeight - 64);
          if (index) expect(card.y).toBeGreaterThan(cards[index - 1]!.y + layout.cardHeight);
          // Mirrored branches have the same horizontal span and vertical distance.
          expect(Math.abs(card.y + layout.cardHeight / 2 - sourceCenter)).toBe(
            Math.abs(cards[count - index - 1]!.y + layout.cardHeight / 2 - sourceCenter),
          );
        }
      });
    }
  }
});
