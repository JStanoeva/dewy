import AsyncStorage from '@react-native-async-storage/async-storage';

import { loadHiddenNotes, saveHiddenNotes } from '@/features/today/services/todayNotesService';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(async () => {
  jest.restoreAllMocks();
  await AsyncStorage.clear();
});

describe('todayNotesService', () => {
  it('stores and clears the folded notes per ritual', async () => {
    await saveHiddenNotes('morning', ['step-1', 'step-2']);
    expect(await loadHiddenNotes('morning')).toEqual(['step-1', 'step-2']);
    expect(await loadHiddenNotes('evening')).toBeNull();
    expect(await AsyncStorage.getItem('dewy.todayNotesHidden.morning')).toBe('["step-1","step-2"]');

    await saveHiddenNotes('morning', null);
    expect(await loadHiddenNotes('morning')).toBeNull();
  });

  it('counts anything but a list of step ids as shown', async () => {
    for (const stored of ['abc', '3', '[]', '[1,2]', '{"a":1}', '']) {
      await AsyncStorage.setItem('dewy.todayNotesHidden.evening', stored);
      expect(await loadHiddenNotes('evening')).toBeNull();
    }
  });

  it('counts a failed read as shown', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('storage unavailable'));
    expect(await loadHiddenNotes('morning')).toBeNull();
  });

  it('never throws when a write fails', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
    jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('disk full'));
    await expect(saveHiddenNotes('evening', ['step-1'])).resolves.toBeUndefined();
    await expect(saveHiddenNotes('evening', null)).resolves.toBeUndefined();
  });
});
