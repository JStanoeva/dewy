import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  AppState,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useProducts } from '@/features/products/hooks/useProducts';
import { DraggableStepList } from '@/features/routines/components/DraggableStepList';
import { UndoBar } from '@/features/routines/components/UndoBar';
import { WeekStrip } from '@/features/routines/components/WeekStrip';
import {
  useMoveRoutineStep,
  useRemoveRoutineStep,
} from '@/features/routines/hooks/useRoutineMutations';
import { useRoutineSteps } from '@/features/routines/hooks/useRoutineSteps';
import type { RoutineStep } from '@/features/routines/types';
import { routineMeta } from '@/features/routines/utils/weekSchedule';
import { useLocalToday } from '@/hooks/useLocalToday';
import type { RootStackParamList, RoutinesStackParamList } from '@/navigation/types';
import { useDewyTheme, useRitualPeriod } from '@/theme/ThemeProvider';
import type { Period } from '@/theme/period';
import { fonts, fontSizes, letterSpacings, radii, spacing } from '@/theme/tokens';
import { isoWeekday } from '@/utils/localDate';

type RoutinesScreenProps = CompositeScreenProps<
  NativeStackScreenProps<RoutinesStackParamList, 'Routines'>,
  NativeStackScreenProps<RootStackParamList>
>;

const periodOptions = [
  { value: 'morning', label: 'Morning' },
  { value: 'evening', label: 'Evening' },
] as const;

const undoMillis = 5000;

export function RoutinesScreen({ navigation, route }: RoutinesScreenProps) {
  const { palette } = useDewyTheme();
  const { ritualPeriod } = useRitualPeriod();
  const insets = useSafeAreaInsets();
  const steps = useRoutineSteps();
  const products = useProducts();
  const today = useLocalToday();
  // Starts on the ritual Today shows, then keeps its own; switching here never changes the palette.
  const [chosenPeriod, setChosenPeriod] = useState<Period>(ritualPeriod);
  // A Details chip's period wins until the control is switched, so the same chip works again.
  const period = route.params?.period ?? chosenPeriod;
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const moveStep = useMoveRoutineStep();
  const removeStep = useRemoveRoutineStep();
  // Swiped away: waiting for Undo, or being deleted.
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  // The step the Undo bar offers back; its delete waits until the bar goes.
  const [undoStep, setUndoStep] = useState<RoutineStep | null>(null);
  // The same step, for the timer, a drag and leaving, which can run with an older render's functions.
  const undoRef = useRef<RoutineStep | null>(null);

  const loaded = steps.data !== undefined && products.data !== undefined;
  const shownSteps = steps.data?.filter((step) => !hiddenIds.includes(step.id));
  const periodSteps = shownSteps?.filter((step) => step.period === period) ?? [];
  const hasOwnedProducts = products.data?.some((product) => product.status === 'owned') ?? false;
  // Shown for either ritual's steps, so switching the control never moves it.
  const hasSteps = (shownSteps?.length ?? 0) > 0;

  function offerUndo(step: RoutineStep | null) {
    undoRef.current = step;
    setUndoStep(step);
  }

  function showAgain(id: string) {
    setHiddenIds((ids) => ids.filter((hidden) => hidden !== id));
  }

  // Sends the delete the Undo bar held back; if it fails, the step comes back in its place.
  function commitRemoval() {
    const step = undoRef.current;
    if (!step) {
      return;
    }
    offerUndo(null);
    removeStep.mutateAsync(step.id).then(
      () => showAgain(step.id),
      () => {
        showAgain(step.id);
        Alert.alert("Couldn't remove the step", 'Check your connection and try again.');
      },
    );
  }

  function removeSwiped(step: RoutineStep) {
    commitRemoval();
    setHiddenIds((ids) => [...ids, step.id]);
    offerUndo(step);
    AccessibilityInfo.announceForAccessibility(`${step.product.name} removed`);
  }

  function undo() {
    const step = undoRef.current;
    if (step) {
      offerUndo(null);
      showAgain(step.id);
    }
  }

  const sendHeldRemoval = useEffectEvent(commitRemoval);

  useEffect(() => {
    if (!undoStep) {
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Android's "Time to take action" setting can make it longer.
    AccessibilityInfo.getRecommendedTimeoutMillis(undoMillis).then((millis) => {
      if (!cancelled) {
        timer = setTimeout(() => sendHeldRemoval(), millis);
      }
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [undoStep]);

  // Leaving Routines or Dewy sends it at once, so a closed app can't bring the step back.
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => sendHeldRemoval());
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        sendHeldRemoval();
      }
    });
    return () => {
      unsubscribe();
      subscription.remove();
      sendHeldRemoval();
    };
  }, [navigation]);

  // Local state, so the spinner only shows for a pull and not for background refetches.
  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([steps.refetch(), products.refetch()]);
    setRefreshing(false);
  }

  function choosePeriod(next: Period) {
    commitRemoval();
    setChosenPeriod(next);
    navigation.setParams({ period: undefined });
  }

  function addStep() {
    navigation.navigate('RoutineStepForm', { period });
  }

  function reorder(stepIds: string[]) {
    moveStep.mutate(
      { period, stepIds },
      {
        onError: () =>
          Alert.alert("Couldn't save the new order", 'Check your connection and try again.'),
      },
    );
  }

  function retry() {
    if (steps.isLoadingError) {
      steps.refetch();
    }
    if (products.isLoadingError) {
      products.refetch();
    }
  }

  const header = (
    <View style={loaded && periodSteps.length > 0 && styles.headerAboveList}>
      <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>
        Your <Text style={[styles.titleItalic, { color: palette.emphasis }]}>rituals</Text>
      </Text>
      {loaded && hasSteps ? (
        <Text style={[styles.subtitle, { color: palette.textMuted }]}>
          Drag to reorder · tap a step to edit
        </Text>
      ) : null}
      {loaded ? (
        <View style={styles.segmented}>
          <SegmentedControl options={periodOptions} value={period} onChange={choosePeriod} />
        </View>
      ) : null}
      {loaded && periodSteps.length > 0 ? (
        <>
          <View style={styles.weekStrip}>
            <WeekStrip period={period} steps={periodSteps} todayWeekday={isoWeekday(today)} />
          </View>
          <View style={styles.ritualHeader}>
            <Text accessibilityRole="header" style={[styles.ritualTitle, { color: palette.text }]}>
              {period === 'morning' ? 'Morning ritual' : 'Evening ritual'}
            </Text>
            <Text style={[styles.meta, { color: palette.textMuted }]}>
              {routineMeta(periodSteps)}
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );

  return (
    <Screen edges={['left', 'right']} statusBarBackdrop>
      <Animated.ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, undoStep && styles.contentAboveUndo]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing && loaded}
            onRefresh={handleRefresh}
            colors={[palette.primary]}
            progressBackgroundColor={palette.surface}
            progressViewOffset={insets.top}
            tintColor={palette.primary}
          />
        }
      >
        {header}
        {loaded && periodSteps.length > 0 ? (
          <DraggableStepList
            key={period}
            steps={periodSteps}
            scrollRef={scrollRef}
            onPressStep={(step) =>
              navigation.navigate('RoutineStepForm', { period: step.period, stepId: step.id })
            }
            onReorder={reorder}
            onRemoveStep={removeSwiped}
            onDragStart={commitRemoval}
            footer={
              <Pressable
                accessibilityRole="button"
                onPress={addStep}
                style={({ pressed }) => [
                  styles.addStep,
                  { borderColor: palette.mauve, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Svg
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={palette.textMuted}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                >
                  <Path d="M12 5v14M5 12h14" />
                </Svg>
                <Text style={[styles.addStepLabel, { color: palette.textMuted }]}>
                  Add a step from your shelf
                </Text>
              </Pressable>
            }
          />
        ) : loaded ? (
          hasOwnedProducts ? (
            <EmptyState
              title="Add your first step"
              message={`Pick a product from your shelf to start your ${period} ritual.`}
              action={{ label: 'Add a step', onPress: addStep }}
            />
          ) : (
            <EmptyState
              title="Add a product first"
              message="Routine steps use products you own, so start with your shelf."
              action={{
                label: 'Add a product',
                onPress: () => navigation.navigate('ProductForm', { status: 'owned' }),
              }}
            />
          )
        ) : steps.isLoadingError || products.isLoadingError ? (
          <ErrorState
            message="We couldn't load your rituals. Check your connection and try again."
            onRetry={retry}
            retrying={steps.isFetching || products.isFetching}
          />
        ) : (
          <LoadingState />
        )}
      </Animated.ScrollView>
      {undoStep ? (
        <UndoBar key={undoStep.id} productName={undoStep.product.name} onUndo={undo} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingTop: 56,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.screen,
  },
  // Room for the Undo bar, so it never covers the last step or the add button.
  contentAboveUndo: {
    paddingBottom: 96,
  },
  headerAboveList: {
    marginBottom: spacing.sm,
  },
  title: {
    overflow: 'visible',
    fontFamily: fonts.display,
    fontSize: fontSizes.titleLarge,
    lineHeight: fontSizes.titleLarge * 1.1,
    letterSpacing: letterSpacings.title,
  },
  titleItalic: {
    fontFamily: fonts.displayItalic,
  },
  subtitle: {
    marginTop: spacing.xxs,
    fontFamily: fonts.body,
    fontSize: fontSizes.secondary,
  },
  segmented: {
    marginTop: 18,
  },
  weekStrip: {
    marginTop: spacing.lg,
  },
  // Wraps the meta under the title when both don't fit, e.g. at a larger font size.
  ritualHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    columnGap: spacing.md,
    marginTop: 18,
  },
  // Grows into the row's slack, so a hair-short Android measurement can't wrap the title.
  ritualTitle: {
    flexGrow: 1,
    fontFamily: fonts.display,
    fontSize: fontSizes.section,
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: fontSizes.meta,
  },
  addStep: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 56,
    marginTop: spacing.sm,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radii.detailCard,
  },
  addStepLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.secondary,
  },
});
