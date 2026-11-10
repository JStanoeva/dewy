import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PlusIcon } from '@/navigation/TabIcons';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';

// The design leaves 28 under the tabs for the system bar; taller insets replace it rather than add to it.
const MIN_BOTTOM_SPACE = 28;
// The add button rises this far above the bar, so the root grows by it to keep the button inside its bounds.
const FAB_OVERHANG = 20;
const FAB_SIZE = 60;

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
    <View style={styles.root}>
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
        {/* The add button is drawn over this slot. */}
        <View style={styles.tab} />
        {tabs.slice(2)}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add a product"
        onPress={() => navigation.navigate('ProductForm')}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: palette.accentStrong,
            borderColor: palette.background,
            boxShadow: palette.fabShadow,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <PlusIcon color={palette.onPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: -FAB_OVERHANG,
    paddingTop: FAB_OVERHANG,
    pointerEvents: 'box-none',
  },
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
  fab: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: FAB_SIZE,
    height: FAB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderRadius: FAB_SIZE / 2,
  },
});
