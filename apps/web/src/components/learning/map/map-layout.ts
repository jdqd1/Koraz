export type Position = { x: number; y: number };
export type Positions = Record<string, Position>;
export function initialLayout(
  ids: string[],
  width: number,
  root = false,
  cardHeight = root ? 184 : 172,
): Positions {
  const w = root ? 208 : 200,
    h = cardHeight;
  if (width < 768) {
    const mobileCardWidth = Math.min(300, Math.max(196, width - 84));
    return Object.fromEntries(ids.map((id, i) => [
      id,
      { x: Math.max(56, (width - mobileCardWidth) / 2 + 20), y: 18 + i * (h + 12) },
    ]));
  }
  return Object.fromEntries(
    ids.map((id, i) => [id, { x: Math.max(56, (width - w) / 2), y: 72 + i * (h + 72) }]),
  );
}
function overlaps(a: Position, b: Position, root: boolean, cardHeight: number) {
  return (
    Math.abs(a.x - b.x) < (root ? 208 : 200) + 12 &&
    Math.abs(a.y - b.y) < cardHeight + 24
  );
}
export function findFreePosition(
  anchor: Position,
  positions: Positions,
  root = false,
  cardHeight = root ? 184 : 172,
): Position {
  const occupied = Object.values(positions),
    w = (root ? 208 : 200) + 56,
    h = cardHeight + 64;
  if (!occupied.some((p) => overlaps(anchor, p, root, cardHeight)))
    return anchor;
  let tries = 0;
  for (let radius = 1; tries < 200; radius++) {
    const cells: Position[] = [];
    for (let k = -radius + 1; k <= radius; k++) cells.push({ x: radius, y: k });
    for (let k = radius - 1; k >= -radius; k--) cells.push({ x: k, y: radius });
    for (let k = radius - 1; k >= -radius; k--)
      cells.push({ x: -radius, y: k });
    for (let k = -radius + 1; k <= radius; k++)
      cells.push({ x: k, y: -radius });
    for (const cell of cells) {
      if (++tries > 200) break;
      const p = { x: anchor.x + cell.x * w, y: anchor.y + cell.y * h };
      if (!occupied.some((o) => overlaps(p, o, root, cardHeight))) return p;
    }
  }
  return { x: 0, y: Math.max(0, ...occupied.map((p) => p.y)) + h };
}
export function reconcileLayout(
  ids: string[],
  saved: Positions,
  width: number,
  root = false,
  cardHeight = root ? 184 : 172,
) {
  if (width < 768) return initialLayout(ids, width, root, cardHeight);
  const positions = Object.fromEntries(
    Object.entries(saved).filter(([id]) => ids.includes(id)),
  );
  const initial = initialLayout(ids, width, root, cardHeight);
  for (const id of ids)
    if (!positions[id]) {
      const existing = Object.values(positions);
      const anchor = existing.length
        ? { x: Math.max(...existing.map((p) => p.x)) + (root ? 208 : 200) + 56, y: Math.min(...existing.map((p) => p.y)) }
        : initial[id]!;
      positions[id] = findFreePosition(
        anchor,
        positions,
        root,
        cardHeight,
      );
    }
  return positions;
}
export function resolveDropOverlap(
  id: string,
  point: Position,
  positions: Positions,
  root = false,
  cardHeight = root ? 184 : 172,
) {
  return findFreePosition(
    point,
    Object.fromEntries(Object.entries(positions).filter(([key]) => key !== id)),
    root,
    cardHeight,
  );
}
