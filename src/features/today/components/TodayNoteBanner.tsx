import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import type { TodayNote } from '@/features/today/utils/buildTodayRoutine';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';

export function TodayNoteBanner({ note }: { note: TodayNote }) {
  const { palette } = useDewyTheme();

  return (
    <View style={[styles.banner, { backgroundColor: palette.bannerBg }]}>
      <Svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke={palette.accentStrong}
        strokeWidth={1.8}
        strokeLinecap="round"
      >
        <Circle cx="12" cy="12" r="9" />
        <Path d="M12 11v5M12 8h.01" />
      </Svg>
      <Text style={[styles.text, { color: palette.bannerText }]}>
        <Text style={styles.name}>{note.productName}</Text> — {note.note}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.banner,
  },
  text: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSizes.meta,
  },
  name: {
    fontFamily: fonts.bodyBold,
  },
});
