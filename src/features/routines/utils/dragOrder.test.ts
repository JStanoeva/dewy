import {
  moveDraggedRow,
  rowTops,
  sameOrder,
  stackHeight,
} from '@/features/routines/utils/dragOrder';

const gap = 8;
const heights = { a: 64, b: 100, c: 64, d: 64 };
const ids = ['a', 'b', 'c', 'd'];

describe('rowTops', () => {
  it('stacks the rows in order with a gap between them', () => {
    expect(rowTops(ids, heights, gap)).toEqual({ a: 0, b: 72, c: 180, d: 252 });
    expect(rowTops(['c', 'a'], heights, gap)).toEqual({ c: 0, a: 72 });
  });

  it('waits until every row is measured', () => {
    expect(rowTops(['a', 'x'], heights, gap)).toBeNull();
    expect(rowTops([], heights, gap)).toEqual({});
  });
});

describe('stackHeight', () => {
  it('adds the rows and the gaps between them', () => {
    expect(stackHeight(ids, heights, gap)).toBe(316);
    expect(stackHeight(['a'], heights, gap)).toBe(64);
    expect(stackHeight([], heights, gap)).toBe(0);
  });
});

describe('moveDraggedRow', () => {
  it("keeps the order until the dragged row covers a neighbour's middle", () => {
    // b's middle is at 72 + 50 = 122, and a is 64 tall.
    expect(moveDraggedRow(ids, 'a', 57, heights, gap)).toBe(ids);
    expect(moveDraggedRow(ids, 'a', 59, heights, gap)).toEqual(['b', 'a', 'c', 'd']);
  });

  it('moves a row up past the rows it was dragged over', () => {
    expect(moveDraggedRow(ids, 'd', 0, heights, gap)).toEqual(['d', 'a', 'b', 'c']);
    expect(moveDraggedRow(ids, 'c', 60, heights, gap)).toEqual(['a', 'c', 'b', 'd']);
  });

  it('moves a row down past several rows in one go', () => {
    expect(moveDraggedRow(ids, 'a', 260, heights, gap)).toEqual(['b', 'c', 'd', 'a']);
  });

  it("doesn't swap back right after a swap with a taller neighbour", () => {
    const swapped = moveDraggedRow(ids, 'a', 59, heights, gap);
    expect(moveDraggedRow(swapped, 'a', 59, heights, gap)).toBe(swapped);
  });

  it('reaches the first and last places even for a row taller than the one there', () => {
    // The list stops the row at its ends: b can't go above 0, and a can't go below 172 - 64.
    expect(moveDraggedRow(['a', 'b'], 'b', 0, heights, gap)).toEqual(['b', 'a']);
    expect(moveDraggedRow(['a', 'b'], 'a', 108, heights, gap)).toEqual(['b', 'a']);
  });

  it('leaves the order alone for an unknown row', () => {
    expect(moveDraggedRow(ids, 'x', 0, heights, gap)).toBe(ids);
  });
});

describe('sameOrder', () => {
  it('compares ids position by position', () => {
    expect(sameOrder(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(sameOrder(['a', 'b'], ['b', 'a'])).toBe(false);
    expect(sameOrder(['a'], ['a', 'b'])).toBe(false);
  });
});
