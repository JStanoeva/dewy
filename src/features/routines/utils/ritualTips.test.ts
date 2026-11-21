import type { Active, Category } from '@/features/products/constants';
import type { RoutineStep } from '@/features/routines/types';
import { getProductTips, getRitualTips } from '@/features/routines/utils/ritualTips';
import type { Period } from '@/theme/period';

const everyDay = [1, 2, 3, 4, 5, 6, 7];

function step(
  productId: string,
  period: Period,
  actives: Active[] = [],
  { weekdays = everyDay, category = 'serum' }: { weekdays?: number[]; category?: Category } = {},
): RoutineStep {
  return {
    id: `${productId}-${period}`,
    productId,
    period,
    position: 0,
    weekdays,
    durationSeconds: 60,
    waitMinutes: null,
    createdAt: '2026-11-21T08:00:00Z',
    product: {
      name: `${productId} name`,
      brand: null,
      category,
      packaging: 'dropper',
      photoPath: null,
      actives,
    },
  };
}

function ids(tips: { id: string }[]) {
  return tips.map((tip) => tip.id);
}

describe('getRitualTips', () => {
  // A retinoid serum on Wednesday and Saturday evenings, an acids peel on Tuesday and Friday.
  const alternating = [
    step('cleanser', 'evening', [], { category: 'cleanser' }),
    step('peel', 'evening', ['acids'], { weekdays: [2, 5], category: 'exfoliant' }),
    step('retinol', 'evening', ['retinoid'], { weekdays: [3, 6] }),
  ];

  it("shows the retinoid's two tips on its own nights", () => {
    expect(ids(getRitualTips(alternating, { period: 'evening', weekday: 6 }))).toEqual([
      'retinoid-acids:retinol',
      'night-spf:retinol',
    ]);
  });

  it("shows only the acids product's SPF tip on its nights", () => {
    expect(ids(getRitualTips(alternating, { period: 'evening', weekday: 2 }))).toEqual([
      'night-spf:peel',
    ]);
  });

  it('shows nothing on a night with no active product', () => {
    expect(getRitualTips(alternating, { period: 'evening', weekday: 1 })).toEqual([]);
  });

  it('lists every weekday without one', () => {
    expect(ids(getRitualTips(alternating, { period: 'evening' }))).toEqual([
      'night-spf:peel',
      'retinoid-acids:retinol',
      'night-spf:retinol',
    ]);
  });

  it('warns about acids on its own, with no acids product anywhere', () => {
    const steps = [step('retinol', 'evening', ['retinoid'])];
    expect(ids(getRitualTips(steps, { period: 'evening', weekday: 6 }))).toEqual([
      'retinoid-acids:retinol',
      'night-spf:retinol',
    ]);
  });

  it('carries the tip fields for the banner', () => {
    const [tip] = getRitualTips([step('retinol', 'evening', ['retinoid'])], { period: 'evening' });
    expect(tip).toEqual({
      id: 'retinoid-acids:retinol',
      kind: 'clash',
      ruleId: 'retinoid-acids',
      productId: 'retinol',
      productName: 'retinol name',
      text: 'Skip exfoliating acids tonight',
    });
  });

  describe("the artboards' shelf", () => {
    const steps = [
      step('vitc', 'morning', ['vitc'], { weekdays: [1] }),
      step('spf', 'morning', [], { weekdays: [1, 2, 3, 4, 5], category: 'spf' }),
      step('retinal', 'evening', ['retinoid'], { weekdays: [1, 4, 6] }),
    ];

    it('gives Monday morning the SPF pairing first, then the retinoid clash', () => {
      const tips = getRitualTips(steps, { period: 'morning', weekday: 1 });
      expect(tips.map((tip) => [tip.productName, tip.text])).toEqual([
        ['vitc name', 'Follow with SPF, they protect better together'],
        ['vitc name', 'Keep it for mornings and your retinoid for nights'],
      ]);
    });

    it('gives the evening the acids clash first, then the SPF pairing', () => {
      const tips = getRitualTips(steps, { period: 'evening', weekday: 4 });
      expect(tips.map((tip) => tip.text)).toEqual([
        'Skip exfoliating acids tonight',
        'Wear SPF tomorrow morning',
      ]);
    });
  });

  describe('Follow with SPF', () => {
    it('counts an SPF product in the morning ritual on any weekday', () => {
      const steps = [
        step('vitc', 'morning', ['vitc']),
        step('spf', 'morning', [], { weekdays: [1, 2, 3, 4, 5], category: 'spf' }),
      ];
      expect(ids(getRitualTips(steps, { period: 'morning', weekday: 6 }))).toEqual([
        'vitc-spf:vitc',
      ]);
    });

    it('ignores an SPF product in the evening ritual', () => {
      const steps = [
        step('vitc', 'morning', ['vitc']),
        step('spf', 'evening', [], { category: 'spf' }),
      ];
      expect(getRitualTips(steps, { period: 'morning' })).toEqual([]);
    });

    it('needs vitamin C in the morning ritual', () => {
      const steps = [
        step('vitc', 'evening', ['vitc']),
        step('spf', 'morning', [], { category: 'spf' }),
      ];
      expect(getRitualTips(steps, { period: 'evening' })).toEqual([]);
    });

    it('never pairs a vitamin C sunscreen with itself', () => {
      const steps = [step('vitc-spf', 'morning', ['vitc'], { category: 'spf' })];
      expect(getRitualTips(steps, { period: 'morning' })).toEqual([]);
    });
  });

  describe('clashes that need another product', () => {
    it('needs another product with the second active, in either ritual', () => {
      const lonely = [step('vitc', 'morning', ['vitc'])];
      expect(getRitualTips(lonely, { period: 'morning' })).toEqual([]);

      const withRetinoid = [...lonely, step('retinal', 'evening', ['retinoid'])];
      expect(ids(getRitualTips(withRetinoid, { period: 'morning' }))).toEqual([
        'vitc-retinoid:vitc',
      ]);
    });

    it('never clashes a product with itself', () => {
      const steps = [step('vitc-acid', 'morning', ['vitc', 'acids'])];
      expect(getRitualTips(steps, { period: 'morning' })).toEqual([]);
      expect(
        ids(getRitualTips([...steps, step('toner', 'evening', ['acids'])], { period: 'morning' })),
      ).toEqual(['vitc-acids:vitc-acid']);
    });

    it('tells benzoyl peroxide apart from both the retinoid and vitamin C', () => {
      const steps = [
        step('vitc', 'morning', ['vitc']),
        step('bpo', 'morning', ['bpo'], { category: 'cleanser' }),
        step('retinol', 'evening', ['retinoid']),
      ];
      expect(ids(getRitualTips(steps, { period: 'morning' }))).toEqual([
        'vitc-retinoid:vitc',
        'vitc-bpo:vitc',
      ]);
      expect(ids(getRitualTips(steps, { period: 'evening' }))).toEqual([
        'retinoid-acids:retinol',
        'retinoid-bpo:retinol',
        'night-spf:retinol',
      ]);
    });

    it('counts the other product on any weekday', () => {
      const steps = [
        step('vitc', 'morning', ['vitc'], { weekdays: [1] }),
        step('peel', 'evening', ['acids'], { weekdays: [5] }),
      ];
      expect(ids(getRitualTips(steps, { period: 'morning', weekday: 1 }))).toEqual([
        'vitc-acids:vitc',
      ]);
    });
  });

  it('gives a retinoid in both rituals the clash in each, and the SPF tip only at night', () => {
    const steps = [
      step('retinol', 'morning', ['retinoid']),
      step('retinol', 'evening', ['retinoid']),
    ];
    expect(ids(getRitualTips(steps, { period: 'morning' }))).toEqual(['retinoid-acids:retinol']);
    expect(ids(getRitualTips(steps, { period: 'evening' }))).toEqual([
      'retinoid-acids:retinol',
      'night-spf:retinol',
    ]);
  });

  it('gives an acids product in the morning ritual no tip', () => {
    expect(getRitualTips([step('toner', 'morning', ['acids'])], { period: 'morning' })).toEqual([]);
  });
});

describe('getProductTips', () => {
  it('lists clashes before pairings, from both rituals', () => {
    const steps = [
      step('vitc', 'morning', ['vitc']),
      step('spf', 'morning', [], { category: 'spf' }),
      step('retinal', 'evening', ['retinoid']),
    ];
    expect(getProductTips(steps, 'vitc').map((tip) => [tip.kind, tip.ruleId])).toEqual([
      ['clash', 'vitc-retinoid'],
      ['pair', 'vitc-spf'],
    ]);
  });

  it('lists a tip once when the product is in both rituals', () => {
    const steps = [
      step('retinol', 'evening', ['retinoid'], { weekdays: [3, 6] }),
      step('retinol', 'morning', ['retinoid'], { weekdays: [1] }),
    ];
    expect(ids(getProductTips(steps, 'retinol'))).toEqual([
      'retinoid-acids:retinol',
      'night-spf:retinol',
    ]);
  });

  it("doesn't give the second active's product the clash", () => {
    const steps = [
      step('peel', 'evening', ['acids'], { weekdays: [2, 5] }),
      step('retinol', 'evening', ['retinoid'], { weekdays: [3, 6] }),
    ];
    expect(ids(getProductTips(steps, 'peel'))).toEqual(['night-spf:peel']);
  });

  it('has nothing for a product in no ritual or without actives', () => {
    const steps = [step('cleanser', 'morning', [], { category: 'cleanser' })];
    expect(getProductTips(steps, 'shelf-only')).toEqual([]);
    expect(getProductTips(steps, 'cleanser')).toEqual([]);
  });
});
