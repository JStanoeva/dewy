import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useProducts } from '@/features/products/hooks/useProducts';
import { RoutineStepRow } from '@/features/routines/components/RoutineStepRow';
import { WeekStrip } from '@/features/routines/components/WeekStrip';
import { useRoutineSteps } from '@/features/routines/hooks/useRoutineSteps';
import { routineMeta } from '@/features/routines/utils/weekSchedule';
import { useLocalToday } from '@/hooks/useLocalToday';
import type { RootStackParamList, RoutinesStackParamList } from '@/navigation/types';
import { useDewyTheme } from '@/theme/ThemeProvider';
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

export function RoutinesScreen({ navigation, route }: RoutinesScreenProps) {
  const { palette, paletteName } = useDewyTheme();
  const steps = useRoutineSteps();
  const products = useProducts();
  const today = useLocalToday();
  // Starts on the period the palette shows; switching here never changes the palette.
  const [chosenPeriod, setChosenPeriod] = useState<Period>(paletteName);
  // A Details chip's period wins until the control is switched, so the same chip works again.
  const period = route.params?.period ?? chosenPeriod;
  const [refreshing, setRefreshing] = useState(false);

  const loaded = steps.data !== undefined && products.data !== undefined;
  const periodSteps = steps.data?.filter((step) => step.period === period) ?? [];
  const hasOwnedProducts = products.data?.some((product) => product.status === 'owned') ?? false;
  // Shown for either ritual's steps, so switching the control never moves it.
  const hasSteps = (steps.data?.length ?? 0) > 0;

  // Local state, so the spinner only shows for a pull and not for background refetches.
  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([steps.refetch(), products.refetch()]);
    setRefreshing(false);
  }

  function choosePeriod(next: Period) {
    setChosenPeriod(next);
    navigation.setParams({ period: undefined });
  }

  function addStep() {
    navigation.navigate('RoutineStepForm', { period });
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
        <Text style={[styles.subtitle, { color: palette.textMuted }]}>Tap a step to edit</Text>
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
    <Screen edges={['left', 'right']}>
      <FlatList
        data={loaded ? periodSteps : []}
        keyExtractor={(step) => step.id}
        renderItem={({ item, index }) => (
          <RoutineStepRow
            step={item}
            number={index + 1}
            showWait={index < periodSteps.length - 1}
            onPress={() =>
              navigation.navigate('RoutineStepForm', { period: item.period, stepId: item.id })
            }
          />
        )}
        ListHeaderComponent={header}
        ListFooterComponent={
          loaded && periodSteps.length > 0 ? (
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
          ) : undefined
        }
        ListEmptyComponent={
          loaded ? (
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
          )
        }
        ItemSeparatorComponent={StepGap}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing && loaded}
            onRefresh={handleRefresh}
            colors={[palette.primary]}
            progressBackgroundColor={palette.surface}
            tintColor={palette.primary}
          />
        }
      />
    </Screen>
  );
}

function StepGap() {
  return <View style={styles.stepGap} />;
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingTop: 56,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.screen,
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
  stepGap: {
    height: spacing.xs,
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
