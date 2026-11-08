import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { TodayScreen } from '@/features/today/screens/TodayScreen';
import { DewyTabBar } from '@/navigation/DewyTabBar';
import { MeStack } from '@/navigation/MeStack';
import { RoutinesStack } from '@/navigation/RoutinesStack';
import { ShelfStack } from '@/navigation/ShelfStack';
import { BottleIcon, ListIcon, MoonIcon, PersonIcon, SunIcon } from '@/navigation/TabIcons';
import type { MainTabParamList } from '@/navigation/types';
import { useDewyTheme } from '@/theme/ThemeProvider';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const { paletteName } = useDewyTheme();

  return (
    <Tab.Navigator
      tabBar={(props) => <DewyTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="TodayTab"
        component={TodayScreen}
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) =>
            paletteName === 'morning' ? <SunIcon color={color} /> : <MoonIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="ShelfTab"
        component={ShelfStack}
        options={{ title: 'Shelf', tabBarIcon: ({ color }) => <BottleIcon color={color} /> }}
      />
      <Tab.Screen
        name="RoutinesTab"
        component={RoutinesStack}
        options={{ title: 'Routines', tabBarIcon: ({ color }) => <ListIcon color={color} /> }}
      />
      <Tab.Screen
        name="MeTab"
        component={MeStack}
        options={{ title: 'Me', tabBarIcon: ({ color }) => <PersonIcon color={color} /> }}
      />
    </Tab.Navigator>
  );
}
