import { describe, expect, it } from "vitest";
import { horizontalLevelLayout, visibleLevelRange } from "./map-horizontal-layout";

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

describe("visible row window", () => {
  it("keeps the same window for small scroll movements and bounds a 200-card map", () => {
    const range = (top: number) => visibleLevelRange(200, top, 600, 1, 12, 176);
    expect(range(0)).toEqual(range(10));
    expect(range(10)).toEqual(range(20));
    for (const top of [0, 176, 12_000, 35_000]) {
      const window = range(top);
      expect(window.end - window.start).toBeLessThanOrEqual(9);
      expect(window.start).toBeGreaterThanOrEqual(0);
      expect(window.end).toBeLessThanOrEqual(200);
      const firstVisible = Math.max(0, Math.min(199, Math.floor((top - 12) / 176)));
      expect(window.start).toBeLessThanOrEqual(firstVisible);
      expect(window.end).toBeGreaterThan(firstVisible);
    }
  });
  it("covers the first and last rows at every supported zoom", () => {
    for (const zoom of [.65, 1, 1.35]) {
      const first = visibleLevelRange(200, 0, 600, zoom, 12, 176);
      const last = visibleLevelRange(200, (12 + 199 * 176) * zoom, 600, zoom, 12, 176);
      expect(first.start).toBe(0);
      expect(last.end).toBe(200);
      expect(last.start).toBeLessThan(200);
    }
  });
  it("keeps all cards available in ordinary levels", () => {
    expect(visibleLevelRange(8, 400, 600, .65, 12, 176)).toEqual({ start: 0, end: 8 });
  });
});
