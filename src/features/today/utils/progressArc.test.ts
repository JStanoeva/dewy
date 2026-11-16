import { arcPath, arcPoint } from '@/features/today/utils/progressArc';

describe('arcPoint', () => {
  it('matches the artboards at both ends and the top', () => {
    expect(arcPoint(0).x).toBeCloseTo(15);
    expect(arcPoint(0).y).toBeCloseTo(150);
    expect(arcPoint(0.5).x).toBeCloseTo(150);
    expect(arcPoint(0.5).y).toBeCloseTo(15);
    expect(arcPoint(1).x).toBeCloseTo(285);
    expect(arcPoint(1).y).toBeCloseTo(150);
  });

  it('puts 2 of 5 at 40% of the way round', () => {
    expect(arcPoint(0.4).x).toBeCloseTo(108.28, 2);
    expect(arcPoint(0.4).y).toBeCloseTo(21.61, 2);
  });
});

describe('arcPath', () => {
  it('draws the whole track at 1', () => {
    expect(arcPath(1)).toBe('M15 150 A135 135 0 0 1 285 150');
  });

  it('ends at the progress point, rounded', () => {
    expect(arcPath(0.5)).toBe('M15 150 A135 135 0 0 1 150 15');
    expect(arcPath(0.4)).toBe('M15 150 A135 135 0 0 1 108.28 21.61');
  });
});
