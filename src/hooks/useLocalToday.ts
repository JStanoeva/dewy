import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { todayLocalDate, type LocalDate } from '@/utils/localDate';

// Today's local date, re-read whenever the app returns to the foreground.
export function useLocalToday(): LocalDate {
  const [today, setToday] = useState(() => todayLocalDate());

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setToday(todayLocalDate());
      }
    });
    return () => subscription.remove();
  }, []);

  return today;
}
