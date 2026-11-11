import { StyleSheet, Text, View } from 'react-native';

import type { BottleColors } from '@/theme/bottleColors';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

export type BottleShape = 'dropper' | 'pump' | 'jar' | 'tube';

type Part = {
  width: number;
  height: number;
  radii: readonly [number, number, number, number];
  color: 'cap' | 'body';
};

// Artboard parts from top to bottom; radii run top-left, top-right, bottom-right, bottom-left.
const shapes: Record<BottleShape, readonly Part[]> = {
  dropper: [
    { width: 12, height: 16, radii: [8, 8, 3, 3], color: 'cap' },
    { width: 22, height: 10, radii: [3, 3, 3, 3], color: 'cap' },
    { width: 38, height: 50, radii: [11, 11, 11, 11], color: 'body' },
  ],
  pump: [
    { width: 20, height: 6, radii: [3, 3, 3, 3], color: 'cap' },
    { width: 6, height: 10, radii: [1, 1, 1, 1], color: 'cap' },
    { width: 22, height: 8, radii: [3, 3, 3, 3], color: 'cap' },
    { width: 42, height: 64, radii: [12, 12, 12, 12], color: 'body' },
  ],
  jar: [
    { width: 62, height: 16, radii: [7, 7, 7, 7], color: 'cap' },
    { width: 66, height: 40, radii: [8, 8, 16, 16], color: 'body' },
  ],
  tube: [
    { width: 40, height: 6, radii: [2, 2, 2, 2], color: 'cap' },
    { width: 40, height: 66, radii: [4, 4, 14, 14], color: 'body' },
    { width: 24, height: 14, radii: [3, 3, 7, 7], color: 'cap' },
  ],
};

// The card bottle (Shelf) and the large hero bottle (Product details), as drawn in the artboards.
const sizes = {
  card: { scale: 0.9, labelRadius: 3 },
  hero: { scale: 2.4, labelRadius: 6 },
} as const;

type BottleIllustrationProps = {
  shape: BottleShape;
  colors: BottleColors;
  size: keyof typeof sizes;
  monogram?: string;
};

export function BottleIllustration({ shape, colors, size, monogram }: BottleIllustrationProps) {
  const { palette } = useDewyTheme();
  const { scale, labelRadius } = sizes[size];

  return (
    <View style={styles.stack}>
      {shapes[shape].map((part, index) => (
        <View
          key={index}
          style={[
            styles.part,
            {
              width: part.width * scale,
              height: part.height * scale,
              borderTopLeftRadius: part.radii[0] * scale,
              borderTopRightRadius: part.radii[1] * scale,
              borderBottomRightRadius: part.radii[2] * scale,
              borderBottomLeftRadius: part.radii[3] * scale,
              backgroundColor: part.color === 'body' ? colors.body : colors.cap,
            },
          ]}
        >
          {part.color === 'body' ? (
            <View
              style={[
                styles.label,
                {
                  width: part.width * scale * 0.62,
                  height: part.height * scale * 0.34,
                  borderRadius: labelRadius,
                  backgroundColor: size === 'hero' ? colors.heroLabel : colors.label,
                },
              ]}
            >
              {monogram ? (
                <Text
                  allowFontScaling={false}
                  numberOfLines={1}
                  style={[styles.monogram, { color: palette.plum }]}
                >
                  {monogram}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    alignItems: 'center',
  },
  part: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogram: {
    overflow: 'visible',
    fontFamily: fonts.displayItalicRegular,
    fontSize: 15,
  },
});
