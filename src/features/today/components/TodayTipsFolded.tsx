import type { Ref } from 'react';
import { Pressable, StyleSheet, Text, type ViewInstance } from 'react-native';

import { bannerStyles, TipInfoIcon } from '@/features/today/components/TodayTipBanner';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, minTouchTarget } from '@/theme/tokens';

type TodayTipsFoldedProps = {
  count: number;
  onShow: () => void;
  ref?: Ref<ViewInstance>;
};

// The folded banners: one row in the banner style that shows them again.
export function TodayTipsFolded({ count, onShow, ref }: TodayTipsFoldedProps) {
  const { palette } = useDewyTheme();

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={`${count} tips for today, show`}
      accessibilityState={{ expanded: false }}
      onPress={onShow}
      style={({ pressed }) => [
        bannerStyles.banner,
        styles.row,
        { backgroundColor: palette.bannerBg, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <TipInfoIcon />
      <Text style={[bannerStyles.text, { color: palette.bannerText }]}>{count} tips for today</Text>
      <Text style={[styles.show, { color: palette.bannerText }]}>Show</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: minTouchTarget,
  },
  // The inline-link look; Morning's emphasis on the peach banner would be too faint.
  show: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.meta,
    textDecorationLine: 'underline',
  },
});
