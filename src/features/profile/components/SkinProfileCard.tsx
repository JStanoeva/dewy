import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SkinSwatch } from '@/features/profile/components/SkinTypePicker';
import { skinConcernLabels, skinGoalLabels, skinTypeDetails } from '@/features/profile/constants';
import type { Profile } from '@/features/profile/types';
import { useDewyTheme } from '@/theme/ThemeProvider';
import {
  fixedWidthMaxFontScale,
  fonts,
  fontSizes,
  letterSpacings,
  minTouchTarget,
  radii,
  spacing,
} from '@/theme/tokens';

type SkinProfileCardProps = {
  profile: Profile;
  onOpen: () => void;
};

// Profile's Skin profile card: the saved details with Edit, or a short invitation with Add.
export function SkinProfileCard({ profile, onOpen }: SkinProfileCardProps) {
  const { palette } = useDewyTheme();
  const { skinType, concerns, skinGoals } = profile;
  const empty = skinType === null && concerns.length === 0 && skinGoals.length === 0;

  return (
    <View
      style={[styles.card, { backgroundColor: palette.surface, boxShadow: palette.cardShadow }]}
    >
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.heading, { color: palette.textMuted }]}>
          Skin profile
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={empty ? 'Add skin details' : 'Edit skin profile'}
          onPress={onOpen}
          style={({ pressed }) => [styles.link, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={[styles.linkLabel, { color: palette.emphasis }]}>
            {empty ? 'Add' : 'Edit'}
          </Text>
        </Pressable>
      </View>

      {empty ? (
        <Text style={[styles.invite, { color: palette.textMuted }]}>
          Add your skin type, concerns and goals if you like. It&apos;s optional, and you can change
          it anytime.
        </Text>
      ) : (
        <View style={styles.details}>
          {skinType ? (
            <View style={styles.typeLine}>
              <SkinSwatch type={skinType} />
              <Text style={[styles.typeName, { color: palette.text }]}>
                {skinTypeDetails[skinType].label}
              </Text>
            </View>
          ) : null}
          {concerns.length > 0 || skinGoals.length > 0 ? (
            <View style={styles.rows}>
              <PillRow
                label="Concerns"
                items={concerns.map((concern) => skinConcernLabels[concern])}
                background={palette.peach}
              />
              <PillRow
                label="Goals"
                items={skinGoals.map((goal) => skinGoalLabels[goal])}
                background={palette.lilac}
              />
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

type PillRowProps = {
  label: string;
  items: string[];
  background: string;
};

function PillRow({ label, items, background }: PillRowProps) {
  const { palette } = useDewyTheme();
  if (items.length === 0) {
    return null;
  }
  return (
    <View style={styles.row}>
      <Text
        maxFontSizeMultiplier={fixedWidthMaxFontScale}
        style={[styles.rowLabel, { color: palette.textMuted }]}
      >
        {label}
      </Text>
      {items.map((item) => (
        <View key={item} style={[styles.pill, { backgroundColor: background }]}>
          <Text style={[styles.pillLabel, { color: palette.onAccent }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.kicker,
    letterSpacing: letterSpacings.sectionLabel,
    textTransform: 'uppercase',
  },
  // 44 high and wide for the finger, pulled back so the header row stays as drawn.
  link: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginVertical: -spacing.md,
  },
  linkLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.secondary,
  },
  invite: {
    marginTop: spacing.snug,
    fontFamily: fonts.body,
    fontSize: fontSizes.secondary,
    lineHeight: fontSizes.secondary * 1.45,
  },
  details: {
    marginTop: spacing.snug,
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  typeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  typeName: {
    fontFamily: fonts.display,
    fontSize: fontSizes.subSection,
  },
  rows: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rowLabel: {
    width: 64,
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.kicker,
  },
  pill: {
    height: 28,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
  },
  pillLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.kicker,
  },
});
