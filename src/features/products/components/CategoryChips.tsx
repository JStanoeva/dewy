import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type LayoutRectangle,
  type ScrollViewInstance,
} from 'react-native';

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
  // Scrolls the selected chip into view, also when Edit or label reading picks it.
  revealSelected?: boolean;
};

export function CategoryChips<T extends string>({
  options,
  value,
  onChange,
  shadow = true,
  revealSelected = false,
}: CategoryChipsProps<T>) {
  const { palette } = useDewyTheme();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const scrollX = useRef(0);
  const chipFrames = useRef(new Map<T, LayoutRectangle>());
  const [chipsLaidOut, setChipsLaidOut] = useState(false);
  const [viewWidth, setViewWidth] = useState(0);

  useEffect(() => {
    const frame = value === undefined ? undefined : chipFrames.current.get(value);
    if (!revealSelected || !chipsLaidOut || !frame || viewWidth === 0) {
      return;
    }
    const left = frame.x - spacing.screen;
    const right = frame.x + frame.width + spacing.screen - viewWidth;
    if (left < scrollX.current) {
      scrollRef.current?.scrollTo({ x: left, animated: true });
    } else if (right > scrollX.current) {
      scrollRef.current?.scrollTo({ x: right, animated: true });
    }
  }, [revealSelected, value, chipsLaidOut, viewWidth]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      onLayout={(event) => setViewWidth(event.nativeEvent.layout.width)}
      onScroll={(event) => {
        scrollX.current = event.nativeEvent.contentOffset.x;
      }}
      scrollEventThrottle={16}
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
            onLayout={
              revealSelected
                ? (event) => {
                    chipFrames.current.set(option.value, event.nativeEvent.layout);
                    // Each chip reports on its own, so wait for all of them.
                    if (chipFrames.current.size === options.length) {
                      setChipsLaidOut(true);
                    }
                  }
                : undefined
            }
            onPress={() => onChange(option.value)}
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
