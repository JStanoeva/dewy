import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  measure,
  scrollTo,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useScrollOffset,
  useSharedValue,
  withSpring,
  withTiming,
  type AnimatedRef,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { RoutineStepRow } from '@/features/routines/components/RoutineStepRow';
import { dragHandleWidth } from '@/features/routines/components/StepCard';
import type { RoutineStep } from '@/features/routines/types';
import {
  moveDraggedRow,
  rowTops,
  sameOrder,
  stackHeight,
} from '@/features/routines/utils/dragOrder';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { minTouchTarget, spacing } from '@/theme/tokens';

type DraggableStepListProps = {
  steps: RoutineStep[];
  // The screen's scroll view, which scrolls by itself while a step is held near its top or bottom.
  scrollRef: AnimatedRef<Animated.ScrollView>;
  // Shows under the steps once they're measured, so it never jumps.
  footer: ReactNode;
  onPressStep: (step: RoutineStep) => void;
  onReorder: (stepIds: string[]) => void;
};

// What every row reads and calls while one of them is dragged.
type Drag = {
  tops: SharedValue<Record<string, number> | null>;
  activeId: SharedValue<string | null>;
  liftedId: SharedValue<string | null>;
  dragTop: SharedValue<number>;
  start: (id: string, fingerY: number) => void;
  move: (translationY: number, fingerY: number) => void;
  end: (id: string) => void;
};

const gap = spacing.xs;
// The list scrolls by itself while the finger is this close to its top or bottom edge.
const edgeZone = 80;
const edgeSpeed = 8;
const spring = { duration: 300, dampingRatio: 0.9 };

// Routines' steps, which can be put in a new order by dragging their handles.
export function DraggableStepList({
  steps,
  scrollRef,
  footer,
  onPressStep,
  onReorder,
}: DraggableStepListProps) {
  const insets = useSafeAreaInsets();
  const scrollY = useScrollOffset(scrollRef);
  const idsKey = steps.map((step) => step.id).join(',');

  const order = useSharedValue(idsKey.split(','));
  const heights = useSharedValue<Record<string, number>>({});
  const tops = useDerivedValue(() => rowTops(order.get(), heights.get(), gap));
  const activeId = useSharedValue<string | null>(null);
  // Stays set while a dropped row lands, so it keeps drawing over its neighbours.
  const liftedId = useSharedValue<string | null>(null);
  const dragTop = useSharedValue(0);
  const dragStart = useSharedValue({
    top: 0,
    scroll: 0,
    order: [] as string[],
    viewTop: 0,
    viewBottom: 0,
  });
  const finger = useSharedValue({ translationY: 0, y: 0 });

  // Follows the saved order (after a drop, a Move up or down, or a refetch), except during a drag.
  useEffect(() => {
    if (activeId.get() === null) {
      order.set(idsKey.split(','));
    }
  }, [idsKey, order, activeId]);

  function measureRow(id: string, height: number) {
    heights.modify((value) => {
      'worklet';
      value[id] = height;
      return value;
    });
  }

  // Keeps the dragged row under the finger and moves its neighbours out of the way.
  const follow = () => {
    'worklet';
    const id = activeId.get();
    if (id === null) {
      return;
    }
    const start = dragStart.get();
    const lowest = stackHeight(order.get(), heights.get(), gap) - (heights.get()[id] ?? 0);
    const top = start.top + finger.get().translationY + scrollY.get() - start.scroll;
    dragTop.set(Math.min(Math.max(top, 0), lowest));
    const next = moveDraggedRow(order.get(), id, dragTop.get(), heights.get(), gap);
    if (next !== order.get()) {
      order.set(next);
    }
  };

  const autoscroll = useFrameCallback(() => {
    const { viewTop, viewBottom } = dragStart.get();
    const y = finger.get().y;
    const speed = y < viewTop + edgeZone ? -edgeSpeed : y > viewBottom - edgeZone ? edgeSpeed : 0;
    if (activeId.get() === null || speed === 0) {
      return;
    }
    scrollTo(scrollRef, 0, Math.max(scrollY.get() + speed, 0), false);
    follow();
  }, false);

  function setAutoscroll(active: boolean) {
    autoscroll.setActive(active);
  }

  const drag: Drag = {
    tops,
    activeId,
    liftedId,
    dragTop,
    start: (id, fingerY) => {
      'worklet';
      const top = tops.get()?.[id];
      if (top === undefined || activeId.get() !== null) {
        return;
      }
      const view = measure(scrollRef);
      dragStart.set({
        top,
        scroll: scrollY.get(),
        order: order.get(),
        // The status bar backdrop covers the top of the scroll view.
        viewTop: view ? view.pageY + insets.top : 0,
        viewBottom: view ? view.pageY + view.height : 0,
      });
      finger.set({ translationY: 0, y: fingerY });
      dragTop.set(top);
      activeId.set(id);
      liftedId.set(id);
      scheduleOnRN(setAutoscroll, true);
    },
    move: (translationY, fingerY) => {
      'worklet';
      finger.set({ translationY, y: fingerY });
      follow();
    },
    end: (id) => {
      'worklet';
      if (activeId.get() !== id) {
        return;
      }
      activeId.set(null);
      scheduleOnRN(setAutoscroll, false);
      if (!sameOrder(order.get(), dragStart.get().order)) {
        scheduleOnRN(onReorder, order.get());
      }
    },
  };

  const shownStyle = useAnimatedStyle(() => ({ opacity: tops.get() === null ? 0 : 1 }));
  const heightStyle = useAnimatedStyle(() => ({
    height: tops.get() === null ? 0 : stackHeight(order.get(), heights.get(), gap),
  }));

  return (
    <Animated.View style={shownStyle}>
      <Animated.View style={heightStyle}>
        {steps.map((step, index) => (
          <DraggableRow
            key={step.id}
            step={step}
            number={index + 1}
            showWait={index < steps.length - 1}
            draggable={steps.length > 1}
            drag={drag}
            onPress={() => onPressStep(step)}
            onMeasure={(height) => measureRow(step.id, height)}
          />
        ))}
      </Animated.View>
      {footer}
    </Animated.View>
  );
}

type DraggableRowProps = {
  step: RoutineStep;
  number: number;
  showWait: boolean;
  draggable: boolean;
  drag: Drag;
  onPress: () => void;
  onMeasure: (height: number) => void;
};

function DraggableRow({
  step,
  number,
  showWait,
  draggable,
  drag,
  onPress,
  onMeasure,
}: DraggableRowProps) {
  const { palette } = useDewyTheme();
  const { tops, activeId, liftedId, dragTop } = drag;
  const id = step.id;
  const y = useSharedValue(0);
  // Hidden until its first place is known, so it never slides in from the top.
  const placed = useSharedValue(false);

  useAnimatedReaction(
    () => tops.get()?.[id],
    (top) => {
      if (top === undefined || activeId.get() === id) {
        return;
      }
      y.set(placed.get() ? withSpring(top, spring) : top);
      placed.set(true);
    },
  );

  const pan = usePanGesture({
    enabled: draggable,
    // Starts with the first movement, before the scroll view can take the touch.
    minDistance: 0,
    onActivate: (event) => {
      'worklet';
      drag.start(id, event.absoluteY);
    },
    onUpdate: (event) => {
      'worklet';
      if (activeId.get() === id) {
        drag.move(event.translationY, event.absoluteY);
      }
    },
    onDeactivate: () => {
      'worklet';
      if (activeId.get() !== id) {
        return;
      }
      // Lands from where the finger let go.
      y.set(dragTop.get());
      y.set(
        withSpring(tops.get()?.[id] ?? dragTop.get(), spring, () => {
          if (liftedId.get() === id && activeId.get() !== id) {
            liftedId.set(null);
          }
        }),
      );
      drag.end(id);
    },
  });

  const waitStyle = useAnimatedStyle(() => ({
    opacity: withTiming(activeId.get() === id ? 0 : 1, { duration: 150 }),
  }));

  const rowStyle = useAnimatedStyle(() => {
    const active = activeId.get() === id;
    return {
      opacity: placed.get() ? 1 : 0,
      zIndex: liftedId.get() === id ? 1 : 0,
      // A layout position, not a transform: Android orders TalkBack by layout position.
      top: active ? dragTop.get() : y.get(),
      transform: [{ scale: withSpring(active ? 1.03 : 1, spring) }],
    };
  });

  return (
    <Animated.View
      onLayout={(event) => onMeasure(event.nativeEvent.layout.height)}
      style={[styles.row, rowStyle]}
    >
      <RoutineStepRow
        step={step}
        number={number}
        showWait={showWait}
        onPress={onPress}
        waitStyle={waitStyle}
        handle={
          draggable ? (
            <GestureDetector gesture={pan}>
              <View
                accessible={false}
                importantForAccessibility="no-hide-descendants"
                // Takes the touch, so the card doesn't dim or open the editor under a drag.
                onStartShouldSetResponder={() => true}
                style={styles.handle}
              >
                <Svg
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={palette.mauve}
                  strokeWidth={3}
                  strokeLinecap="round"
                >
                  <Path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01" />
                </Svg>
              </View>
            </GestureDetector>
          ) : undefined
        }
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  handle: {
    width: dragHandleWidth,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
