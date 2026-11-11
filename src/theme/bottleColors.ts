// Bottle colours stay the same in both palettes, like the artboards.
const peach = '#ffcdb2';
const salmon = '#ffb4a2';
const rose = '#e5989b';
const mauve = '#b5838d';
const plum = '#6d6875';
const white = '#FFFFFF';
const cream = '#FFF5EF';
const labelOnLight = 'rgba(109, 104, 117, 0.16)';
const labelOnColour = 'rgba(255, 255, 255, 0.6)';
const heroLabelOnColour = 'rgba(255, 255, 255, 0.65)';

type BottleColorSet = {
  tile: string;
  body: string;
  cap: string;
  label: string;
};

export type BottleColors = BottleColorSet & {
  heroLabel: string;
  statusBar: 'light' | 'dark';
};

// The tile, body and cap combinations drawn in the approved artboards.
const bottleColorSets: readonly BottleColorSet[] = [
  { tile: rose, body: peach, cap: plum, label: labelOnColour },
  { tile: peach, body: white, cap: plum, label: labelOnLight },
  { tile: plum, body: salmon, cap: peach, label: labelOnColour },
  { tile: salmon, body: white, cap: mauve, label: labelOnLight },
  { tile: mauve, body: cream, cap: plum, label: labelOnLight },
  { tile: peach, body: rose, cap: plum, label: labelOnColour },
  { tile: salmon, body: cream, cap: rose, label: labelOnLight },
  { tile: rose, body: white, cap: mauve, label: labelOnLight },
  { tile: plum, body: rose, cap: peach, label: labelOnColour },
  { tile: peach, body: mauve, cap: plum, label: labelOnColour },
  { tile: salmon, body: cream, cap: plum, label: labelOnLight },
];

export function bottleColorsFor(productId: string): BottleColors {
  let hash = 0;
  for (let index = 0; index < productId.length; index += 1) {
    hash = (hash * 31 + productId.charCodeAt(index)) >>> 0;
  }
  const set = bottleColorSets[hash % bottleColorSets.length];
  return {
    ...set,
    heroLabel: set.label === labelOnColour ? heroLabelOnColour : set.label,
    // Status bar icons drawn over the tile: light only on the dark plum tile.
    statusBar: set.tile === plum ? 'light' : 'dark',
  };
}
