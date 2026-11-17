import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

import type { Period } from '@/theme/period';

const hiddenNotesSchema = z.array(z.string()).min(1);

// One key per ritual on the phone; another account's steps never match the stored ids, so its Today clears them.
function hiddenKey(period: Period) {
  return `dewy.todayNotesHidden.${period}`;
}

// The important step ids a ritual had when its banners were folded; null when they show or can't be read.
export async function loadHiddenNotes(period: Period): Promise<string[] | null> {
  try {
    const stored = await AsyncStorage.getItem(hiddenKey(period));
    if (stored === null) {
      return null;
    }
    const parsed = hiddenNotesSchema.safeParse(JSON.parse(stored));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// Best effort: if the phone can't save it, the banners still fold or show on screen.
export async function saveHiddenNotes(period: Period, stepIds: string[] | null): Promise<void> {
  try {
    if (stepIds === null) {
      await AsyncStorage.removeItem(hiddenKey(period));
    } else {
      await AsyncStorage.setItem(hiddenKey(period), JSON.stringify(stepIds));
    }
  } catch {
    // Nothing to do; the on-screen choice stays for this session.
  }
}
