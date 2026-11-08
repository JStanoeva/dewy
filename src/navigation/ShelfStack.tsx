import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ShelfScreen } from '@/features/products/screens/ShelfScreen';
import type { ShelfStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<ShelfStackParamList>();

export function ShelfStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Shelf" component={ShelfScreen} />
    </Stack.Navigator>
  );
}
