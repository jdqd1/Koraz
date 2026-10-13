import type { Positions } from "./map-layout";

/** One column of children, branching horizontally from the group's midpoint. */
export function horizontalLevelLayout(ids: string[], width: number, height: number, compact: boolean) {
  const cardWidth = compact ? Math.min(320, Math.max(192, width - 120)) : 300;
  const cardHeight = 160;
  const originWidth = compact ? 72 : 156;
  const originHeight = 60;
  const gap = compact ? 24 : 112;
  const margin = compact ? 12 : 40;
  const rowGap = compact ? 16 : 24;
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
    contentWidth, contentHeight, firstCardY: top, rowStride: cardHeight + rowGap,
  };
}

/** Keep a few rows outside the native scroll viewport; updates only cross row boundaries. */
export function visibleLevelRange(count: number, top: number, height: number, zoom: number, firstY: number, stride: number) {
  if (count < 30) return { start: 0, end: count };
  return {
    start: Math.max(0, Math.min(count - 1, Math.floor((top / zoom - firstY) / stride) - 2)),
    end: Math.min(count, Math.max(1, Math.ceil(((top + height) / zoom - firstY) / stride) + 2)),
  };
}
