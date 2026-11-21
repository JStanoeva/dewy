import AsyncStorage from '@react-native-async-storage/async-storage';

import { loadHiddenTips, saveHiddenTips } from '@/features/today/services/todayTipsService';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(async () => {
  jest.restoreAllMocks();
  await AsyncStorage.clear();
});

describe('todayTipsService', () => {
  it('stores and clears the folded tips per ritual', async () => {
    await saveHiddenTips('morning', ['vitc-spf:p1', 'vitc-retinoid:p1']);
    expect(await loadHiddenTips('morning')).toEqual(['vitc-spf:p1', 'vitc-retinoid:p1']);
    expect(await loadHiddenTips('evening')).toBeNull();
    expect(await AsyncStorage.getItem('dewy.todayTipsHidden.morning')).toBe(
      '["vitc-spf:p1","vitc-retinoid:p1"]',
    );

    await saveHiddenTips('morning', null);
    expect(await loadHiddenTips('morning')).toBeNull();
  });

  it('ignores the folded notes an older version stored', async () => {
    await AsyncStorage.setItem('dewy.todayNotesHidden.evening', '["step-1","step-2"]');
    expect(await loadHiddenTips('evening')).toBeNull();
  });

  it('counts anything but a list of tip ids as shown', async () => {
    for (const stored of ['abc', '3', '[]', '[1,2]', '{"a":1}', '']) {
      await AsyncStorage.setItem('dewy.todayTipsHidden.evening', stored);
      expect(await loadHiddenTips('evening')).toBeNull();
    }
  });

  it('counts a failed read as shown', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('storage unavailable'));
    expect(await loadHiddenTips('morning')).toBeNull();
  });

  it('never throws when a write fails', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
    jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('disk full'));
    await expect(saveHiddenTips('evening', ['night-spf:p1'])).resolves.toBeUndefined();
    await expect(saveHiddenTips('evening', null)).resolves.toBeUndefined();
  });
});
