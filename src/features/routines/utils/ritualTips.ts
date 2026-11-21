import type { Active } from '@/features/products/constants';
import type { RoutineStep } from '@/features/routines/types';
import type { Period } from '@/theme/period';

export type RitualTipKind = 'clash' | 'pair';

export type RitualTip = {
  // `ruleId:productId`, the same on every day, so a fold can remember it.
  id: string;
  kind: RitualTipKind;
  ruleId: string;
  productId: string;
  productName: string;
  text: string;
};

type TipRule = {
  id: string;
  kind: RitualTipKind;
  text: string;
  // Whether this ritual step's product gets the tip, given every step of both rituals.
  applies: (step: RoutineStep, steps: readonly RoutineStep[]) => boolean;
};

function has(step: RoutineStep, active: Active) {
  return step.product.actives.includes(active);
}

// Another product in either ritual, on any weekday; a product never clashes with itself.
function otherHas(step: RoutineStep, steps: readonly RoutineStep[], active: Active) {
  return steps.some((other) => other.productId !== step.productId && has(other, active));
}

// In Today's order: the SPF to follow with, then the clashes, then tomorrow's SPF.
const rules: TipRule[] = [
  {
    id: 'vitc-spf',
    kind: 'pair',
    text: 'Follow with SPF, they protect better together',
    applies: (step, steps) =>
      step.period === 'morning' &&
      has(step, 'vitc') &&
      steps.some(
        (other) =>
          other.period === 'morning' &&
          other.productId !== step.productId &&
          other.product.category === 'spf',
      ),
  },
  {
    id: 'retinoid-acids',
    kind: 'clash',
    text: 'Skip exfoliating acids tonight',
    applies: (step) => has(step, 'retinoid'),
  },
  {
    id: 'retinoid-bpo',
    kind: 'clash',
    text: 'Use benzoyl peroxide in the morning and the retinoid at night',
    applies: (step, steps) => has(step, 'retinoid') && otherHas(step, steps, 'bpo'),
  },
  {
    id: 'vitc-retinoid',
    kind: 'clash',
    text: 'Keep it for mornings and your retinoid for nights',
    applies: (step, steps) => has(step, 'vitc') && otherHas(step, steps, 'retinoid'),
  },
  {
    id: 'vitc-bpo',
    kind: 'clash',
    text: 'Benzoyl peroxide can weaken vitamin C, so split them AM and PM',
    applies: (step, steps) => has(step, 'vitc') && otherHas(step, steps, 'bpo'),
  },
  {
    id: 'vitc-acids',
    kind: 'clash',
    text: 'Both are acidic, so alternate days if your skin feels tingly',
    applies: (step, steps) => has(step, 'vitc') && otherHas(step, steps, 'acids'),
  },
  {
    id: 'night-spf',
    kind: 'pair',
    text: 'Wear SPF tomorrow morning',
    applies: (step) => step.period === 'evening' && (has(step, 'retinoid') || has(step, 'acids')),
  },
];

function tipsFor(step: RoutineStep, steps: readonly RoutineStep[]): RitualTip[] {
  return rules
    .filter((rule) => rule.applies(step, steps))
    .map((rule) => ({
      id: `${rule.id}:${step.productId}`,
      kind: rule.kind,
      ruleId: rule.id,
      productId: step.productId,
      productName: step.product.name,
      text: rule.text,
    }));
}

// A ritual's tips in step order: for one weekday on Today, or every weekday without one.
export function getRitualTips(
  steps: readonly RoutineStep[],
  { period, weekday }: { period: Period; weekday?: number },
): RitualTip[] {
  return steps
    .filter(
      (step) =>
        step.period === period && (weekday === undefined || step.weekdays.includes(weekday)),
    )
    .flatMap((step) => tipsFor(step, steps));
}

// Every tip of one product, from both rituals and all days, once each: clashes first, then pairings.
export function getProductTips(steps: readonly RoutineStep[], productId: string): RitualTip[] {
  const unique = new Map<string, RitualTip>();
  for (const step of steps) {
    if (step.productId === productId) {
      for (const tip of tipsFor(step, steps)) {
        unique.set(tip.id, tip);
      }
    }
  }
  const order = (tip: RitualTip) =>
    (tip.kind === 'clash' ? 0 : rules.length) + rules.findIndex((rule) => rule.id === tip.ruleId);
  return [...unique.values()].sort((a, b) => order(a) - order(b));
}
