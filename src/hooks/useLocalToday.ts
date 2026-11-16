import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { getRitualDate } from '@/theme/period';
import { todayLocalDate, type LocalDate } from '@/utils/localDate';

// The app can resume on a later day, so the date is re-read whenever it returns to the foreground.
function useDateOnForeground(readDate: () => LocalDate): LocalDate {
  const [date, setDate] = useState(() => readDate());

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setDate(readDate());
      }
    });
    return () => subscription.remove();
  }, [readDate]);

  return date;
}

// Today's local calendar date.
export function useLocalToday(): LocalDate {
  return useDateOnForeground(todayLocalDate);
}

// Today's ritual day, which turns over at 05:00 instead of midnight.
export function useRitualDate(): LocalDate {
  return useDateOnForeground(getRitualDate);
}
