import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, type ScrollViewInstance } from 'react-native';

import { categories, categoryDetails, type Category } from '@/features/products/constants';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, minTouchTarget, radii, spacing } from '@/theme/tokens';

export type CategoryFilter = Category | 'all';

type ChipOption<T extends string> = { value: T; label: string };

export const categoryOptions: ChipOption<Category>[] = categories.map((category) => ({
  value: category,
  label: categoryDetails[category].label,
}));

export const categoryFilterOptions: ChipOption<CategoryFilter>[] = [
  { value: 'all', label: 'All' },
  ...categoryOptions,
];

// Room inside the scroll view for the chip shadow, which Android would otherwise clip.
const shadowTop = 8;
const shadowBottom = 16;

type CategoryChipsProps<T extends string> = {
  options: readonly ChipOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  // The Shelf filter chips cast a shadow; the product form's Type chips are drawn flat.
  shadow?: boolean;
};

export function CategoryChips<T extends string>({
  options,
  value,
  onChange,
  shadow = true,
}: CategoryChipsProps<T>) {
  const { palette } = useDewyTheme();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const rowWidth = useRef(0);
  const chipEnds = useRef<Partial<Record<string, number>>>({});
  const tapped = useRef(false);

  // A type set by a barcode lookup may be off-screen, so scroll the row until that chip fits.
  useEffect(() => {
    if (tapped.current) {
      tapped.current = false;
      return;
    }
    const end = value === undefined ? undefined : chipEnds.current[value];
    if (end !== undefined) {
      const x = Math.max(0, end + spacing.screen - rowWidth.current);
      scrollRef.current?.scrollTo({ x, animated: true });
    }
  }, [value]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      onLayout={(event) => {
        rowWidth.current = event.nativeEvent.layout.width;
      }}
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
            onLayout={(event) => {
              const { x, width } = event.nativeEvent.layout;
              chipEnds.current[option.value] = x + width;
            }}
            onPress={() => {
              tapped.current = option.value !== value;
              onChange(option.value);
            }}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? palette.ink : palette.surface,
                boxShadow: shadow ? palette.chipShadow : undefined,
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
