import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ViewInstance,
} from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { RitualProgressArc } from '@/features/today/components/RitualProgressArc';
import { TodayNoteBanner } from '@/features/today/components/TodayNoteBanner';
import { TodayNotesFolded } from '@/features/today/components/TodayNotesFolded';
import { TodayStepRow } from '@/features/today/components/TodayStepRow';
import { useTodayRoutine } from '@/features/today/hooks/useTodayRoutine';
import { loadHiddenNotes, saveHiddenNotes } from '@/features/today/services/todayNotesService';
import { todayState, type TodayRoutine } from '@/features/today/utils/buildTodayRoutine';
import { foldChanges, importantNoteIds, isFolded } from '@/features/today/utils/noteFold';
import { useRitualDate } from '@/hooks/useLocalToday';
import { MoonIcon, SunIcon } from '@/navigation/TabIcons';
import type { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { useDewyTheme } from '@/theme/ThemeProvider';
import type { Period } from '@/theme/period';
import { fonts, fontSizes, letterSpacings, minTouchTarget, radii, spacing } from '@/theme/tokens';
import { formatWeekdayDayMonth } from '@/utils/localDate';

type TodayScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'TodayTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

const periodOptions = [
  {
    value: 'morning',
    label: 'Morning',
    icon: (color: string) => <SunIcon color={color} size={18} />,
  },
  {
    value: 'evening',
    label: 'Evening',
    icon: (color: string) => <MoonIcon color={color} size={18} />,
  },
] as const;

// A 44 target around the 18-high link that stays clear of the first row below.
const hideNotesSlop = { top: 16, bottom: 10, left: 12, right: 12 };

function progressLine(routine: TodayRoutine, period: Period) {
  if (routine.isComplete) {
    return period === 'morning' ? 'All done — go glow' : 'All done — sweet dreams';
  }
  return `steps done · ${routine.minutesLeft} min to go`;
}

export function TodayScreen({ navigation }: TodayScreenProps) {
  const { palette, paletteName, activePeriod: period, setActivePeriod } = useDewyTheme();
  const date = useRitualDate();
  const profile = useProfile();
  const products = useProducts();
  const { steps, completions, routine } = useTodayRoutine(period, date);
  const [refreshing, setRefreshing] = useState(false);
  // The important notes each ritual had when folded (null when shown); undefined until read.
  const [hiddenNotes, setHiddenNotes] = useState<Record<Period, string[] | null>>();
  const [focusRequest, setFocusRequest] = useState(0);
  const foldedRef = useRef<ViewInstance>(null);
  const hideRef = useRef<ViewInstance>(null);
  const isMorning = paletteName === 'morning';
  const name = profile.data?.displayName;
  const state = todayState({
    routine,
    routineFailed: steps.isLoadingError || completions.isLoadingError,
    hasOwnedProducts: products.data?.some((product) => product.status === 'owned'),
    productsFailed: products.isLoadingError,
  });
  const showRitualHeader = state === 'list' || state === 'dayOff';
  const notes = state === 'list' && routine ? routine.notes : [];
  const notesShown = hiddenNotes !== undefined && notes.length > 0;
  const stepList = steps.data;
  const shownNoteIds = stepList ? importantNoteIds(stepList, period) : [];
  const canFold = notes.length >= 2;
  const folded = canFold && isFolded(hiddenNotes?.[period] ?? null, shownNoteIds);

  // Read once; until then Today shows no banner area, and a failed read counts as shown.
  useEffect(() => {
    Promise.all([loadHiddenNotes('morning'), loadHiddenNotes('evening')]).then(
      ([morning, evening]) => setHiddenNotes({ morning, evening }),
    );
  }, []);

  // Both rituals follow their notes: a new important note opens the banners, as Show does.
  useEffect(() => {
    if (!stepList || !hiddenNotes) {
      return;
    }
    for (const { period: ritual, stored, next } of foldChanges(hiddenNotes, stepList)) {
      saveHiddenNotes(ritual, next).then(() =>
        // Leaves a Hide or Show tapped while this write was running alone.
        setHiddenNotes((current) =>
          current?.[ritual] === stored ? { ...current, [ritual]: next } : current,
        ),
      );
    }
  }, [stepList, hiddenNotes]);

  // After Hide or Show, TalkBack moves to the control that replaced the tapped one.
  useEffect(() => {
    if (focusRequest === 0) {
      return;
    }
    // Android attaches the new view after this effect runs, so the focus waits a moment.
    const timer = setTimeout(() => {
      const target = foldedRef.current ?? hideRef.current;
      if (target) {
        AccessibilityInfo.sendAccessibilityEvent(target, 'focus');
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [focusRequest]);

  function changeFold(hidden: string[] | null) {
    setHiddenNotes((current) => current && { ...current, [period]: hidden });
    saveHiddenNotes(period, hidden);
    setFocusRequest((count) => count + 1);
  }

  // Local state, so the spinner only shows for a pull and not for background refetches.
  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([
      steps.refetch(),
      completions.refetch(),
      products.refetch(),
      profile.refetch(),
    ]);
    setRefreshing(false);
  }

  function retry() {
    if (steps.isLoadingError) {
      steps.refetch();
    }
    if (completions.isLoadingError) {
      completions.refetch();
    }
    if (products.isLoadingError) {
      products.refetch();
    }
  }

  const header = (
    <View style={[styles.header, state === 'list' && !notesShown && styles.headerAboveList]}>
      <View
        style={[styles.circle, { backgroundColor: isMorning ? palette.peach : palette.surfaceAlt }]}
      />
      {isMorning ? null : (
        <>
          <View style={[styles.starLarge, { backgroundColor: palette.peach }]} />
          <View style={[styles.starRight, { backgroundColor: palette.salmon }]} />
          <View style={[styles.starTop, { backgroundColor: palette.rose }]} />
        </>
      )}

      <Text style={[styles.kicker, { color: palette.textMuted }]}>
        {formatWeekdayDayMonth(date)}
      </Text>
      <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>
        {period === 'morning' ? 'Good morning' : 'Good evening'}
        {name ? (
          <>
            {', '}
            <Text style={[styles.titleName, { color: palette.emphasis }]}>{name}</Text>
          </>
        ) : null}
      </Text>

      {routine ? (
        <View style={styles.segmented}>
          <SegmentedControl options={periodOptions} value={period} onChange={setActivePeriod} />
        </View>
      ) : null}

      {state === 'list' && routine ? (
        <View
          accessible
          accessibilityLabel={
            routine.isComplete
              ? `${routine.done} of ${routine.total} steps done. ${progressLine(routine, period)}`
              : `${routine.done} of ${routine.total} steps done, ${routine.minutesLeft} min to go`
          }
          style={styles.progress}
        >
          <RitualProgressArc period={period} steps={routine.steps} />
          <View style={styles.progressText}>
            <Text style={[styles.count, { color: palette.text }]}>
              {routine.done} <Text style={[styles.countOf, { color: palette.emphasis }]}>of</Text>{' '}
              {routine.total}
            </Text>
            <Text style={[styles.progressLine, { color: palette.textMuted }]}>
              {progressLine(routine, period)}
            </Text>
          </View>
        </View>
      ) : null}

      {showRitualHeader ? (
        <View style={styles.ritualHeader}>
          <Text accessibilityRole="header" style={[styles.ritualTitle, { color: palette.text }]}>
            {period === 'morning' ? 'Your morning ritual' : 'Your evening ritual'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit your ${period} ritual`}
            onPress={() =>
              navigation.navigate('RoutinesTab', { screen: 'Routines', params: { period } })
            }
            style={({ pressed }) => [styles.edit, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[styles.editLabel, { color: palette.emphasis }]}>Edit</Text>
          </Pressable>
        </View>
      ) : null}

      {notesShown ? (
        <View style={styles.notes}>
          {folded ? (
            <TodayNotesFolded
              ref={foldedRef}
              count={notes.length}
              onShow={() => changeFold(null)}
            />
          ) : (
            <>
              {notes.map((note) => (
                <TodayNoteBanner key={note.stepId} note={note} />
              ))}
              {canFold ? (
                <Pressable
                  ref={hideRef}
                  accessibilityRole="button"
                  accessibilityLabel="Hide notes"
                  accessibilityState={{ expanded: true }}
                  hitSlop={hideNotesSlop}
                  onPress={() => changeFold(shownNoteIds)}
                  style={({ pressed }) => [styles.hideNotes, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text style={[styles.hideNotesLabel, { color: palette.emphasis }]}>
                    Hide notes
                  </Text>
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      ) : null}
    </View>
  );

  function emptyContent() {
    switch (state) {
      case 'dayOff':
        return (
          <EmptyState
            title={period === 'morning' ? 'Nothing this morning' : 'Nothing this evening'}
            message={`Your ${period} steps fall on other days.`}
          />
        );
      case 'emptyRitual':
        return (
          <EmptyState
            title={`Build your ${period} ritual`}
            message={`Pick products from your shelf for your ${period} ritual.`}
            action={{
              label: 'Add a step',
              onPress: () => navigation.navigate('RoutineStepForm', { period }),
            }}
          />
        );
      case 'noProducts':
        return (
          <EmptyState
            title="Add your first product"
            message="Your ritual is built from the products on your shelf."
            action={{
              label: 'Add a product',
              onPress: () => navigation.navigate('ProductForm', { status: 'owned' }),
            }}
          />
        );
      case 'error':
        return (
          <ErrorState
            message="We couldn't load today's ritual. Check your connection and try again."
            onRetry={retry}
            retrying={steps.isFetching || completions.isFetching || products.isFetching}
          />
        );
      case 'loading':
        return <LoadingState />;
      default:
        return null;
    }
  }

  return (
    <Screen edges={['left', 'right']}>
      <FlatList
        data={state === 'list' && routine ? routine.steps : []}
        keyExtractor={(item) => item.step.id}
        renderItem={({ item }) => (
          <View style={styles.inset}>
            <TodayStepRow
              item={item}
              localDate={date}
              onOpenProduct={() =>
                navigation.navigate('ProductDetails', { productId: item.step.productId })
              }
            />
          </View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={<View style={styles.inset}>{emptyContent()}</View>}
        ItemSeparatorComponent={StepGap}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing && routine !== undefined}
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
  // No horizontal padding here: the header and rows carry it, so the circle keeps its place in the header.
  content: {
    flexGrow: 1,
    paddingBottom: spacing.screen,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: spacing.screen,
  },
  headerAboveList: {
    marginBottom: spacing.xxs,
  },
  inset: {
    paddingHorizontal: spacing.screen,
  },
  circle: {
    position: 'absolute',
    top: -130,
    right: -110,
    width: 300,
    height: 300,
    borderRadius: radii.pill,
  },
  starLarge: {
    position: 'absolute',
    top: 70,
    right: 86,
    width: 4,
    height: 4,
    borderRadius: radii.pill,
  },
  starRight: {
    position: 'absolute',
    top: 118,
    right: 35,
    width: 3,
    height: 3,
    borderRadius: radii.pill,
  },
  starTop: {
    position: 'absolute',
    top: 40,
    right: 139,
    width: 3,
    height: 3,
    borderRadius: radii.pill,
  },
  kicker: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.kicker,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: spacing.snug,
    overflow: 'visible',
    fontFamily: fonts.display,
    fontSize: fontSizes.title,
    lineHeight: fontSizes.title * 1.15,
    letterSpacing: letterSpacings.title,
  },
  titleName: {
    fontFamily: fonts.displayItalic,
  },
  segmented: {
    marginTop: 18,
  },
  // The progress arc's 300×150 frame, with the text where the arc's centre is.
  progress: {
    alignSelf: 'center',
    width: 300,
    height: 150,
    marginTop: 22,
  },
  progressText: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.hairline,
  },
  count: {
    overflow: 'visible',
    fontFamily: fonts.display,
    fontSize: fontSizes.progressCount,
    lineHeight: fontSizes.progressCount,
  },
  countOf: {
    fontFamily: fonts.displayItalic,
    fontSize: fontSizes.section,
  },
  progressLine: {
    fontFamily: fonts.body,
    fontSize: fontSizes.meta,
  },
  // Wraps Edit under the title, still at the right, only if both don't fit, e.g. at a larger font size.
  ritualHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: spacing.md,
    marginTop: 22,
  },
  // Grows into the row's slack, so a hair-short Android measurement can't wrap the title.
  ritualTitle: {
    flexGrow: 1,
    fontFamily: fonts.display,
    fontSize: fontSizes.section,
  },
  // The drawn link is about 33 wide; the minimum width keeps it a 44 target with the word at the right edge.
  edit: {
    marginLeft: 'auto',
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxs,
  },
  editLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.secondary,
  },
  // The 10 above the rows is padding here, so Hide notes' touch area stays inside its parent on Android.
  notes: {
    marginTop: spacing.hairline,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  hideNotes: {
    alignSelf: 'center',
    minHeight: 18,
    justifyContent: 'center',
  },
  hideNotesLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.meta,
  },
  stepGap: {
    height: spacing.xs,
  },
});
