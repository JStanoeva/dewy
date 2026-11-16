import { getRitualDate } from './period';

describe('getRitualDate', () => {
  it('is the calendar day from 05:00', () => {
    expect(getRitualDate(new Date(2026, 10, 16, 5, 0))).toBe('2026-11-16');
    expect(getRitualDate(new Date(2026, 10, 16, 23, 59))).toBe('2026-11-16');
  });

  it('stays on the evening before until 04:59', () => {
    expect(getRitualDate(new Date(2026, 10, 17, 0, 0))).toBe('2026-11-16');
    expect(getRitualDate(new Date(2026, 10, 17, 4, 59))).toBe('2026-11-16');
  });

  it('goes back across month and year ends', () => {
    expect(getRitualDate(new Date(2026, 11, 1, 0, 30))).toBe('2026-11-30');
    expect(getRitualDate(new Date(2027, 0, 1, 3, 0))).toBe('2026-12-31');
    expect(getRitualDate(new Date(2028, 2, 1, 1, 0))).toBe('2028-02-29');
  });

  it('is not shifted by a DST night', () => {
    expect(getRitualDate(new Date(2026, 2, 29, 4, 30))).toBe('2026-03-28');
    expect(getRitualDate(new Date(2026, 9, 25, 4, 30))).toBe('2026-10-24');
  });
});
