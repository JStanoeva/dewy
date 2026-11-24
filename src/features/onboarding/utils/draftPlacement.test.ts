import { draftPlacement } from '@/features/onboarding/utils/draftPlacement';
import type { Active, Category } from '@/features/products/constants';

function placement(category: Category, actives: Active[] = []) {
  return draftPlacement({ category, actives });
}

describe('draftPlacement', () => {
  it('places each category without actives', () => {
    expect(placement('cleanser')).toEqual({ am: true, pm: true });
    expect(placement('exfoliant')).toEqual({ am: false, pm: true });
    expect(placement('toner')).toEqual({ am: true, pm: true });
    expect(placement('mist')).toEqual({ am: true, pm: false });
    expect(placement('serum')).toEqual({ am: true, pm: true });
    expect(placement('moisturizer')).toEqual({ am: true, pm: true });
    expect(placement('spf')).toEqual({ am: true, pm: false });
    expect(placement('mask')).toEqual({ am: false, pm: true });
  });

  it('sends a retinoid or acids to the evening, whatever the category', () => {
    expect(placement('moisturizer', ['retinoid'])).toEqual({ am: false, pm: true });
    expect(placement('toner', ['acids'])).toEqual({ am: false, pm: true });
    expect(placement('spf', ['retinoid'])).toEqual({ am: false, pm: true });
  });

  it('sends vitamin C to the morning, whatever the category', () => {
    expect(placement('serum', ['vitc'])).toEqual({ am: true, pm: false });
    expect(placement('mask', ['vitc'])).toEqual({ am: true, pm: false });
  });

  it('picks the evening when a product has both a morning and an evening active', () => {
    expect(placement('serum', ['vitc', 'retinoid'])).toEqual({ am: false, pm: true });
    expect(placement('serum', ['acids', 'vitc'])).toEqual({ am: false, pm: true });
  });

  it('lets the category decide for benzoyl peroxide alone', () => {
    expect(placement('cleanser', ['bpo'])).toEqual({ am: true, pm: true });
    expect(placement('mask', ['bpo'])).toEqual({ am: false, pm: true });
  });
});
