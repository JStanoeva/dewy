import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { categories, categoryDetails, type Category } from '@/features/products/constants';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, minTouchTarget, radii, spacing } from '@/theme/tokens';

export type CategoryFilter = Category | 'all';

const options: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...categories.map((category) => ({ value: category, label: categoryDetails[category].label })),
];

// Room inside the scroll view for the chip shadow, which Android would otherwise clip.
const shadowTop = 8;
const shadowBottom = 16;

type CategoryChipsProps = {
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
};

export function CategoryChips({ value, onChange }: CategoryChipsProps) {
  const { palette } = useDewyTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? palette.ink : palette.surface,
                boxShadow: palette.chipShadow,
              },
            ]}
          >
            <Text style={[styles.label, { color: selected ? palette.background : palette.text }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    marginTop: -shadowTop,
    marginBottom: -shadowBottom,
  },
  content: {
    gap: spacing.xs,
    paddingHorizontal: spacing.screen,
    paddingTop: shadowTop,
    paddingBottom: shadowBottom,
  },
  chip: {
    height: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.secondary,
  },
});
