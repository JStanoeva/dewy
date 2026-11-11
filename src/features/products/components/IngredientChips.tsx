import { StyleSheet, Text, View } from 'react-native';

import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type IngredientChipsProps = {
  ingredients: string[];
};

export function IngredientChips({ ingredients }: IngredientChipsProps) {
  const { palette } = useDewyTheme();

  return (
    <View style={styles.row}>
      {ingredients.map((ingredient) => (
        <View key={ingredient} style={[styles.chip, { backgroundColor: palette.peach }]}>
          <Text numberOfLines={1} style={[styles.label, { color: palette.onAccent }]}>
            {ingredient}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chip: {
    maxWidth: '100%',
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.meta,
  },
});
