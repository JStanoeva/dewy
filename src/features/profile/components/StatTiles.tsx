import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ProductStatus } from '@/features/products/types';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type StatTilesProps = {
  ownedCount: number;
  attentionCount: number;
  wishlistCount: number;
  onOpenShelf: (tab: ProductStatus) => void;
};

export function StatTiles({
  ownedCount,
  attentionCount,
  wishlistCount,
  onOpenShelf,
}: StatTilesProps) {
  return (
    <View style={styles.row}>
      <StatTile
        count={ownedCount}
        label="on your shelf"
        hint="Opens your shelf"
        onPress={() => onOpenShelf('owned')}
      />
      <StatTile
        count={attentionCount}
        label={attentionCount === 1 ? 'needs attention' : 'need attention'}
        hint="Opens your shelf"
        highlight={attentionCount > 0}
        onPress={() => onOpenShelf('owned')}
      />
      <StatTile
        count={wishlistCount}
        label="on wishlist"
        hint="Opens your wishlist"
        onPress={() => onOpenShelf('wishlist')}
      />
    </View>
  );
}

type StatTileProps = {
  count: number;
  label: string;
  hint: string;
  highlight?: boolean;
  onPress: () => void;
};

function StatTile({ count, label, hint, highlight = false, onPress }: StatTileProps) {
  const { palette } = useDewyTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${count} ${label}`}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        highlight
          ? { backgroundColor: palette.attentionTile }
          : { backgroundColor: palette.surface, boxShadow: palette.cardShadow },
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[styles.count, { color: palette.text }]}>{count}</Text>
      <Text
        style={[
          styles.label,
          highlight
            ? { color: palette.warning, fontFamily: fonts.bodySemiBold }
            : { color: palette.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    gap: spacing.hairline,
    padding: spacing.md,
    borderRadius: radii.option,
  },
  count: {
    overflow: 'visible',
    fontFamily: fonts.display,
    fontSize: fontSizes.statCount,
    lineHeight: fontSizes.statCount * 1.1,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: fontSizes.kicker,
  },
});
