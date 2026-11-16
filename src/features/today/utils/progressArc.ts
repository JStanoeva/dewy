const CENTRE = 150;
const RADIUS = 135;

export type ArcPoint = { x: number; y: number };

// A point on Today's arc, from its left end (0) over the top (0.5) to its right end (1), as the artboards place it.
export function arcPoint(fraction: number): ArcPoint {
  const angle = Math.PI * (1 - fraction);
  return { x: CENTRE + RADIUS * Math.cos(angle), y: CENTRE - RADIUS * Math.sin(angle) };
}

// The arc from its left end to arcPoint(fraction); it never passes 180°, so the small-arc flag always fits.
export function arcPath(fraction: number): string {
  const end = arcPoint(fraction);
  return `M15 150 A135 135 0 0 1 ${round(end.x)} ${round(end.y)}`;
}

function round(value: number) {
  return Number(value.toFixed(2));
}
