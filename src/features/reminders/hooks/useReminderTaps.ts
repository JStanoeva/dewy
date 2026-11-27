import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect } from 'react';

import { listenForReminderTaps } from '@/features/reminders/services/notificationService';
import type { RootStackParamList } from '@/navigation/types';

// A tap opens the product the nudge is about, or Today on the nudge's ritual.
export function useReminderTaps() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(
    () =>
      listenForReminderTaps((data) => {
        if ('productId' in data) {
          navigation.navigate('ProductDetails', { productId: data.productId });
        } else {
          // Pops back to the tabs already open, instead of stacking a second Main over a root screen.
          navigation.popTo('Main', { screen: 'TodayTab', params: { period: data.period } });
        }
      }),
    [navigation],
  );
}
