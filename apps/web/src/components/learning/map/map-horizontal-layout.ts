import type { Positions } from "./map-layout";

/** One column of children, branching horizontally from the group's midpoint. */
export function horizontalLevelLayout(ids: string[], width: number, height: number, compact: boolean) {
  const cardWidth = compact ? Math.min(220, Math.max(156, width - 168)) : 260;
  const cardHeight = compact ? 104 : 96;
  const originWidth = compact ? 96 : 164;
  const originHeight = 60;
  const gap = compact ? 40 : 144;
  const margin = compact ? 16 : 48;
  const rowGap = compact ? 20 : 28;
  const groupHeight = ids.length * cardHeight + Math.max(0, ids.length - 1) * rowGap;
  const contentWidth = Math.max(width, margin * 2 + originWidth + gap + cardWidth);
  const contentHeight = Math.max(height, groupHeight + margin * 2 + 64);
  const left = Math.max(margin, (contentWidth - originWidth - gap - cardWidth) / 2);
  // The extra bottom space leaves the last card clear of the fixed zoom controls.
  const top = Math.max(margin, (contentHeight - 64 - groupHeight) / 2);
  const centerY = top + groupHeight / 2;
  const positions: Positions = Object.fromEntries(ids.map((id, index) => [id, {
    x: left + originWidth + gap,
    y: top + index * (cardHeight + rowGap),
  }]));
  return {
    positions, cardWidth, cardHeight, originWidth, originHeight,
    origin: { x: left, y: centerY - originHeight / 2 },
    contentWidth, contentHeight,
  };
}
