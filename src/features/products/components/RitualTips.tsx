import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import type { RitualTip } from '@/features/routines/utils/ritualTips';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, letterSpacings, radii, spacing } from '@/theme/tokens';

// Product details' Ritual tips: a (!) row for each clash, then a ✓ row for each good pairing.
export function RitualTips({ tips }: { tips: RitualTip[] }) {
  const { palette } = useDewyTheme();

  return (
    <View>
      <Text accessibilityRole="header" style={[styles.label, { color: palette.textMuted }]}>
        Ritual tips
      </Text>
      <Text style={[styles.caption, { color: palette.textMuted }]}>
        Made automatically from its key actives and your shelf
      </Text>
      <View
        style={[styles.card, { backgroundColor: palette.surface, boxShadow: palette.cardShadow }]}
      >
        {tips.map((tip, index) => {
          const clash = tip.kind === 'clash';
          return (
            <View
              key={tip.id}
              accessible
              accessibilityLabel={`${clash ? 'Heads-up' : 'Good pairing'}: ${tip.text}`}
              style={[
                styles.row,
                index < tips.length - 1 && [styles.divider, { borderBottomColor: palette.divider }],
              ]}
            >
              <View
                style={[
                  styles.icon,
                  { backgroundColor: clash ? palette.warningSoft : palette.lilac },
                ]}
              >
                {clash ? <ClashIcon color={palette.berry} /> : <PairIcon color={palette.plum} />}
              </View>
              <Text style={[styles.text, { color: palette.text }]}>{tip.text}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ClashIcon({ color }: { color: string }) {
  return (
    <Svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    >
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 11v5M12 8h.01" />
    </Svg>
  );
}

function PairIcon({ color }: { color: string }) {
  return (
    <Svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M5 12.5l4.5 4.5L19 7.5" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.meta,
    letterSpacing: letterSpacings.section,
    textTransform: 'uppercase',
  },
  caption: {
    marginTop: spacing.hairline,
    fontFamily: fonts.body,
    fontSize: fontSizes.kicker,
  },
  card: {
    marginTop: spacing.xs,
    paddingVertical: spacing.snug,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.detailCard,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  divider: {
    borderBottomWidth: 1,
  },
  icon: {
    width: 32,
    height: 32,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  text: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSizes.secondary,
    lineHeight: 18.9,
  },
});
