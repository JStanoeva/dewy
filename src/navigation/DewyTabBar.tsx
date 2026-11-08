import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';

// The design leaves 28 under the tabs for the system bar; taller insets replace it rather than add to it.
const MIN_BOTTOM_SPACE = 28;

export function DewyTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { palette } = useDewyTheme();

  const tabs = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const focused = state.index === index;
    const color = focused ? palette.text : palette.tabInactive;
    const label = options.title ?? route.name;

    function handlePress() {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    }

    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: focused }}
        onPress={handlePress}
        onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
        style={styles.tab}
      >
        {options.tabBarIcon?.({ focused, color, size: 24 })}
        <Text style={[styles.label, focused && styles.labelActive, { color }]}>{label}</Text>
      </Pressable>
    );
  });

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(insets.bottom, MIN_BOTTOM_SPACE),
          backgroundColor: palette.tabBar,
          boxShadow: palette.tabBarShadow,
        },
      ]}
    >
      {tabs.slice(0, 2)}
      {/* Centre slot for the add-product button. */}
      <View style={styles.tab} />
      {tabs.slice(2)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.md,
    borderTopLeftRadius: radii.tabBar,
    borderTopRightRadius: radii.tabBar,
  },
  tab: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.label,
  },
  labelActive: {
    fontFamily: fonts.bodyBold,
  },
});
