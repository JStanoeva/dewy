import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { categoryDetails } from '@/features/products/constants';
import { StepCard } from '@/features/routines/components/StepCard';
import { formatDuration } from '@/features/routines/utils/stepOptions';
import { useToggleCompletion } from '@/features/today/hooks/useTodayRoutine';
import type { TodayStep } from '@/features/today/utils/buildTodayRoutine';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { radii } from '@/theme/tokens';
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
  const accessibilityLabel = [
    `Step ${number}`,
    categoryDetails[step.product.category].stepKind,
    step.product.name,
    formatDuration(step.durationSeconds),
  ].join(', ');

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
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <StepCard
        step={step}
        number={number}
        done={done}
        accessory={
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
        }
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  check: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: radii.pill,
  },
});
