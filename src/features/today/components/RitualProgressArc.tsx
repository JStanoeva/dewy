import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import type { TodayStep } from '@/features/today/utils/buildTodayRoutine';
import { arcPath, arcPoint } from '@/features/today/utils/progressArc';
import { useDewyTheme } from '@/theme/ThemeProvider';
import type { Period } from '@/theme/period';

// The marker's glow reaches 23 past the 300×150 frame, and Android clips an Svg to its own box.
const BLEED = 23;
const WIDTH = 300 + BLEED * 2;
const HEIGHT = 150 + BLEED * 2;
// The artboard's inset 9px -5px shadow: the moon's disc minus a copy moved 9 right and 5 up.
const CRESCENT = 'M11.34 9.82A15 15 0 1 1 -2.34 -14.82A15 15 0 0 0 11.34 9.82Z';

type RitualProgressArcProps = {
  period: Period;
  steps: readonly TodayStep[];
};

export function RitualProgressArc({ period, steps }: RitualProgressArcProps) {
  const { palette } = useDewyTheme();
  const done = steps.filter((item) => item.done).length;
  const progress = done / steps.length;
  const marker = arcPoint(progress);

  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={styles.arc}
    >
      <Svg width={WIDTH} height={HEIGHT} viewBox={`${-BLEED} ${-BLEED} ${WIDTH} ${HEIGHT}`}>
        <Path
          d={arcPath(1)}
          fill="none"
          stroke={palette.track}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={period === 'evening' ? [1, 10] : undefined}
        />
        {done > 0 ? (
          <Path
            d={arcPath(progress)}
            fill="none"
            stroke={palette.rose}
            strokeWidth={12}
            strokeLinecap="round"
          />
        ) : null}
        {steps.map((item, index) => {
          const dot = arcPoint((index + 0.5) / steps.length);
          return (
            <Circle
              key={item.step.id}
              cx={dot.x}
              cy={dot.y}
              r={5}
              fill={item.done ? palette.accentStrong : palette.arcDot}
              stroke={item.done ? palette.accentStrong : palette.uncheckedRing}
              strokeWidth={2}
            />
          );
        })}
        <G transform={`translate(${marker.x} ${marker.y})`}>
          {period === 'morning' ? (
            <>
              <Circle r={23} fill={palette.sunHalo} />
              <Circle r={13} fill={palette.salmon} stroke={palette.sunRing} strokeWidth={4} />
            </>
          ) : (
            <>
              <Circle r={23} fill={palette.moonHalo} />
              <Circle r={15} fill={palette.background} />
              <Path d={CRESCENT} fill={palette.moon} />
            </>
          )}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  arc: {
    position: 'absolute',
    top: -BLEED,
    left: -BLEED,
  },
});
