export type ImagePointV2 = { x: number; y: number };
export function imagePointV2(point: ImagePointV2, box: { left: number; top: number; width: number; height: number }, image: { width: number; height: number }): ImagePointV2 | null {
  if (box.width <= 0 || box.height <= 0 || image.width <= 0 || image.height <= 0) return null;
  const scale = Math.min(box.width / image.width, box.height / image.height);
  const width = image.width * scale, height = image.height * scale;
  const x = (point.x - box.left - (box.width - width) / 2) / width;
  const y = (point.y - box.top - (box.height - height) / 2) / height;
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) return null;
  return { x, y };
}
