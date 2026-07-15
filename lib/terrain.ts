// Generates a blocky, Minecraft-style stepped terrain silhouette as a
// clip-path polygon. Each entry in `heights` (0 = ground, 1 = full height)
// becomes one flat-topped column with a hard vertical riser to its
// neighbor — pure right angles, no smooth curves, so it reads as built
// from blocks rather than a hand-drawn hill.
export function terrainClipPath(heights: number[]): string {
  const cols = heights.length;
  const points: string[] = ["0% 100%"];
  for (let i = 0; i < cols; i++) {
    const xL = (i / cols) * 100;
    const xR = ((i + 1) / cols) * 100;
    const y = (1 - heights[i]) * 100;
    points.push(`${xL}% ${y}%`, `${xR}% ${y}%`);
  }
  points.push("100% 100%");
  return `polygon(${points.join(", ")})`;
}
