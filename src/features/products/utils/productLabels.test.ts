import { noteLines, productInitials, splitLastWord } from '@/features/products/utils/productLabels';

describe('productInitials', () => {
  it('takes the first letter of the first two words', () => {
    expect(productInitials('Vitamin C 15% Serum')).toBe('VC');
    expect(productInitials('Chwiii Melter')).toBe('CM');
    expect(productInitials('gentle oat cleanser')).toBe('GO');
  });

  it('skips words that start with a digit, symbol or emoji', () => {
    expect(productInitials('🧀 Melt')).toBe('M');
    expect(productInitials('15% Niacinamide Serum')).toBe('NS');
    expect(productInitials('Chwiii Melter 🧀')).toBe('CM');
  });

  it('works for one word, other scripts, and no letters at all', () => {
    expect(productInitials('Retinal')).toBe('R');
    expect(productInitials('Розова вода')).toBe('РВ');
    expect(productInitials('水 Cream')).toBe('水C');
    expect(productInitials('🧀 🧀')).toBe('');
  });
});

describe('splitLastWord', () => {
  it('splits off the last word, keeping the space with the head', () => {
    expect(splitLastWord('Vitamin C 15% Serum')).toEqual({ head: 'Vitamin C 15% ', last: 'Serum' });
  });

  it('keeps emoji and numbers as the last word', () => {
    expect(splitLastWord('Chwiii Melter 🧀')).toEqual({ head: 'Chwiii Melter ', last: '🧀' });
    expect(splitLastWord('Sheer Fluid SPF 50')).toEqual({ head: 'Sheer Fluid SPF ', last: '50' });
  });

  it('puts a one-word name entirely in the last word', () => {
    expect(splitLastWord('Retinal')).toEqual({ head: '', last: 'Retinal' });
  });
});

describe('noteLines', () => {
  it('gives one trimmed line per note and drops blank lines', () => {
    expect(noteLines('Keep apart from retinal\n\n  Follow with SPF  \r\n')).toEqual([
      'Keep apart from retinal',
      'Follow with SPF',
    ]);
  });

  it('is empty without notes', () => {
    expect(noteLines(null)).toEqual([]);
    expect(noteLines(' \n ')).toEqual([]);
  });
});
