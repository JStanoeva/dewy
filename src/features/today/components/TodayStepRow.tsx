import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { categoryDetails } from '@/features/products/constants';
import { nameHyphenation } from '@/features/products/utils/productLabels';
import { StepTile } from '@/features/routines/components/StepTile';
import { formatDuration } from '@/features/routines/utils/stepOptions';
import { useToggleCompletion } from '@/features/today/hooks/useTodayRoutine';
import type { TodayStep } from '@/features/today/utils/buildTodayRoutine';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';
import type { LocalDate } from '@/utils/localDate';

type TodayStepRowProps = {
  item: TodayStep;
  localDate: LocalDate;
  onOpenProduct: () => void;
};

export function TodayStepRow({ item, localDate, onOpenProduct }: TodayStepRowProps) {
  const { palette } = useDewyTheme();
  const toggle = useToggleCompletion(item.step.id, item.step.period);
  const { step, number, done } = item;
  const kind = categoryDetails[step.product.category].stepKind;
  const time = formatDuration(step.durationSeconds);
  const accessibilityLabel = [`Step ${number}`, kind, step.product.name, step.product.brand, time]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={accessibilityLabel}
      accessibilityActions={[{ name: 'longpress', label: 'Open product details' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'longpress') {
          onOpenProduct();
        }
      }}
      onPress={() => toggle(localDate)}
      onLongPress={onOpenProduct}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: palette.surface,
          boxShadow: palette.cardShadow,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <StepTile
        productId={step.productId}
        photoPath={step.product.photoPath}
        size={44}
        shape={step.product.packaging}
      />
      <View style={styles.text}>
        <Text style={[styles.kind, { color: palette.stepLabel }]}>
          Step {number} · {kind}
        </Text>
        {/* Android draws the line-through only when the text mounts with it, so a tick remounts the name. */}
        <Text
          key={done ? 'done' : 'pending'}
          numberOfLines={2}
          android_hyphenationFrequency={nameHyphenation(step.product.name)}
          style={[
            styles.name,
            { color: palette.text },
            done && {
              textDecorationLine: 'line-through',
              textDecorationColor: palette.uncheckedRing,
            },
          ]}
        >
          {step.product.name}
        </Text>
        {/* A long brand shortens, never the time. */}
        <View style={styles.metaRow}>
          {step.product.brand ? (
            <Text
              numberOfLines={1}
              style={[styles.meta, styles.brand, { color: palette.textMuted }]}
            >
              {step.product.brand}
            </Text>
          ) : null}
          <Text style={[styles.meta, { color: palette.textMuted }]}>
            {step.product.brand ? ` · ${time}` : time}
          </Text>
        </View>
      </View>
      <View
        style={[
          styles.check,
          {
            borderColor: done ? palette.accentStrong : palette.uncheckedRing,
            backgroundColor: done ? palette.accentStrong : 'transparent',
          },
        ]}
      >
        {done ? (
          <Svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke={palette.onPrimary}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d="M5 12.5l4.5 4.5L19 7.5" />
          </Svg>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    minHeight: 64,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: spacing.lg,
    borderRadius: radii.detailCard,
  },
  text: {
    flex: 1,
    gap: spacing.hairline,
  },
  kind: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.label,
    letterSpacing: 0.88,
    textTransform: 'uppercase',
  },
  name: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.body,
  },
  metaRow: {
    flexDirection: 'row',
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: fontSizes.meta,
  },
  brand: {
    flexShrink: 1,
  },
  check: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: radii.pill,
  },
});
