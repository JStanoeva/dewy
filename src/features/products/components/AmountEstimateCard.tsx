import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { categoryDetails, type Category, type Fullness } from '@/features/products/constants';
import { getStartingUses } from '@/features/products/utils/usesLeft';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type AmountEstimateCardProps = {
  // Null while the Size box is empty or invalid.
  sizeMl: number | null;
  fullness: Fullness;
  category: Category | undefined;
  // Edit with no tile picked: the uses ticked since the count started, still loading, or not loaded.
  counted?: number | 'counting' | 'failed';
};

function estimateCopy({ sizeMl, fullness, category, counted = 0 }: AmountEstimateCardProps) {
  if (sizeMl === null) {
    return {
      title: 'Not tracking the amount yet',
      body: 'Add the size to get a nudge before it runs out.',
    };
  }
  if (!category) {
    return { title: 'Not tracking the amount yet', body: 'Pick a type to estimate the uses.' };
  }
  const { label, doseMl } = categoryDetails[category];
  const type = category === 'spf' ? label : label.toLowerCase();
  const body = `A typical ${type} use is about ${doseMl} ml. Dewy counts down as you tick it off.`;
  if (counted === 'counting') {
    return { title: 'Counting uses…', body };
  }
  if (counted === 'failed') {
    return { title: "Couldn't count the uses right now", body };
  }
  const uses = Math.max(0, getStartingUses(sizeMl, fullness, category) - counted);
  return {
    title: `≈ ${uses} ${uses === 1 ? 'use' : 'uses'} left`,
    body,
    accessibilityTitle: `About ${uses} ${uses === 1 ? 'use' : 'uses'} left`,
  };
}

// The form's live estimate of how many uses the bottle holds.
export function AmountEstimateCard(props: AmountEstimateCardProps) {
  const { palette } = useDewyTheme();
  const { title, body, accessibilityTitle } = estimateCopy(props);

  return (
    <View
      accessible
      accessibilityLabel={`${accessibilityTitle ?? title}. ${body}`}
      style={[styles.card, { backgroundColor: palette.surface, boxShadow: palette.cardShadow }]}
    >
      <View style={[styles.icon, { backgroundColor: palette.track }]}>
        <Svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke={palette.text}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
          <Path d="M8.5 15.5h7" />
        </Svg>
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
        <Text style={[styles.body, { color: palette.textMuted }]}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.option,
  },
  icon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  text: {
    flex: 1,
    gap: spacing.hairline,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.body,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: fontSizes.meta,
    lineHeight: fontSizes.meta * 1.35,
  },
});
