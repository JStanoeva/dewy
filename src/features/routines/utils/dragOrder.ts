// UI-thread worklets (plain functions in Jest); each helper comes before its callers, as worklets capture them on definition.

export function sameOrder(a: string[], b: string[]): boolean {
  'worklet';
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

// Where each row starts when the rows stack in this order, or null until every row is measured.
export function rowTops(
  ids: string[],
  heights: Record<string, number>,
  gap: number,
): Record<string, number> | null {
  'worklet';
  const tops: Record<string, number> = {};
  let top = 0;
  for (const id of ids) {
    const height = heights[id];
    if (height === undefined) {
      return null;
    }
    tops[id] = top;
    top += height + gap;
  }
  return tops;
}

// How tall the rows are once stacked with a gap between them.
export function stackHeight(ids: string[], heights: Record<string, number>, gap: number): number {
  'worklet';
  const rows = ids.reduce((total, id) => total + (heights[id] ?? 0), 0);
  return rows + gap * Math.max(ids.length - 1, 0);
}

// Moves the dragged row past each neighbour once it covers that neighbour's middle.
export function moveDraggedRow(
  ids: string[],
  draggedId: string,
  draggedTop: number,
  heights: Record<string, number>,
  gap: number,
): string[] {
  'worklet';
  const draggedBottom = draggedTop + (heights[draggedId] ?? 0);
  const next = [...ids];
  let index = next.indexOf(draggedId);
  if (index === -1) {
    return ids;
  }

  const middleOf = (id: string) =>
    (rowTops(next, heights, gap)?.[id] ?? 0) + (heights[id] ?? 0) / 2;

  while (index > 0 && draggedTop < middleOf(next[index - 1])) {
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    index -= 1;
  }
  while (index < next.length - 1 && draggedBottom > middleOf(next[index + 1])) {
    [next[index + 1], next[index]] = [next[index], next[index + 1]];
    index += 1;
  }
  return sameOrder(next, ids) ? ids : next;
}
