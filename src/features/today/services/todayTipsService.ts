import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

import type { Period } from '@/theme/period';

const hiddenTipsSchema = z.array(z.string()).min(1);

// One key per ritual on the phone; another account's tips never match the stored ids, so its Today shows them.
function hiddenKey(period: Period) {
  return `dewy.todayTipsHidden.${period}`;
}

// The tip ids a ritual had when its banners were folded; null when they show or can't be read.
export async function loadHiddenTips(period: Period): Promise<string[] | null> {
  try {
    const stored = await AsyncStorage.getItem(hiddenKey(period));
    if (stored === null) {
      return null;
    }
    const parsed = hiddenTipsSchema.safeParse(JSON.parse(stored));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// Best effort: if the phone can't save it, the banners still fold or show on screen.
export async function saveHiddenTips(period: Period, tipIds: string[] | null): Promise<void> {
  try {
    if (tipIds === null) {
      await AsyncStorage.removeItem(hiddenKey(period));
    } else {
      await AsyncStorage.setItem(hiddenKey(period), JSON.stringify(tipIds));
    }
  } catch {
    // Nothing to do; the on-screen choice stays for this session.
  }
}
