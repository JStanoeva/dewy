import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';

import { listenForReminderTaps } from '@/features/reminders/services/notificationService';

// A tap opens the product the nudge is about, or Today for a ritual reminder.
export function useReminderTaps() {
  const navigation = useNavigation();

  useEffect(
    () =>
      listenForReminderTaps((data) => {
        if ('productId' in data) {
          navigation.navigate('ProductDetails', { productId: data.productId });
        } else {
          navigation.navigate('Main', { screen: 'TodayTab' });
        }
      }),
    [navigation],
  );
}
