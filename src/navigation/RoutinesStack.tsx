import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RoutinesScreen } from '@/features/routines/screens/RoutinesScreen';
import type { RoutinesStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<RoutinesStackParamList>();

export function RoutinesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Routines" component={RoutinesScreen} />
    </Stack.Navigator>
  );
}
