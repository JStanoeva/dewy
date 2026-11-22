import Feather from '@expo/vector-icons/Feather';
import { zodResolver } from '@hookform/resolvers/zod';
import Slider from '@react-native-community/slider';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { Controller, useForm, useWatch, type FieldErrors } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { FieldError } from '@/components/FieldError';
import { FormHeader, formHeaderBottom } from '@/components/FormHeader';
import { FormScrollView, type FormScrollViewHandle } from '@/components/FormScrollView';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { categoryDetails } from '@/features/products/constants';
import { useProducts } from '@/features/products/hooks/useProducts';
import type { Product } from '@/features/products/types';
import { splitLastWord } from '@/features/products/utils/productLabels';
import { ProductPicker } from '@/features/routines/components/ProductPicker';
import { RemoveStepSheet } from '@/features/routines/components/RemoveStepSheet';
import { RitualTiles } from '@/features/routines/components/RitualTiles';
import { WeekdaySelector } from '@/features/routines/components/WeekdaySelector';
import {
  useAddRoutineSteps,
  useMoveRoutineStep,
  useRemoveRoutineStep,
  useUpdateRoutineStep,
} from '@/features/routines/hooks/useRoutineMutations';
import { useRoutineStep, useRoutineSteps } from '@/features/routines/hooks/useRoutineSteps';
import {
  defaultDurationSeconds,
  routineStepFormSchema,
  toRoutineStepFormValues,
  type RoutineStepFormValues,
  type RoutineStepInput,
} from '@/features/routines/schemas/routineStepSchema';
import { createStepConflict } from '@/features/routines/services/routineService';
import type { RoutineStep } from '@/features/routines/types';
import {
  countedPeriods,
  durationStops,
  everyDay,
  formatDuration,
  moveStepIds,
  nearestDurationStop,
  pickableProducts,
  productPeriods,
  waitChoices,
} from '@/features/routines/utils/stepOptions';
import type { RootStackParamList } from '@/navigation/types';
import { useDewyTheme } from '@/theme/ThemeProvider';
import type { Period } from '@/theme/period';
import { fonts, fontSizes, letterSpacings, minTouchTarget, radii, spacing } from '@/theme/tokens';

type RoutineStepFormScreenProps = NativeStackScreenProps<RootStackParamList, 'RoutineStepForm'>;
type Navigation = RoutineStepFormScreenProps['navigation'];

// The design leaves 28 under the button for the system bar; taller insets get a small gap instead.
const MIN_BOTTOM_SPACE = 28;

// Half the 6dp gap on each side, as on the "Use within" tiles.
const tileSlop = { left: spacing.snug / 2, right: spacing.snug / 2 };

export function RoutineStepFormScreen({ navigation, route }: RoutineStepFormScreenProps) {
  const { period, stepId } = route.params;
  if (stepId) {
    // A second quick tap on another row swaps the params, so the key remounts the form with that step.
    return <EditRoutineStep key={stepId} stepId={stepId} navigation={navigation} />;
  }
  return <NewRoutineStep period={period} navigation={navigation} />;
}

type NewRoutineStepProps = {
  period: Period;
  navigation: Navigation;
};

function NewRoutineStep({ period, navigation }: NewRoutineStepProps) {
  const products = useProducts();
  const steps = useRoutineSteps();
  const pickable = products.data && steps.data ? pickableProducts(products.data, steps.data) : [];
  // Once the form has shown it stays, so adding the last product can't flash an empty state as it closes.
  const [formShown, setFormShown] = useState(false);
  if (!formShown && pickable.length > 0) {
    setFormShown(true);
  }

  if ((formShown || pickable.length > 0) && products.data && steps.data) {
    return <RoutineStepForm navigation={navigation} period={period} products={products.data} />;
  }

  function addProduct() {
    navigation.navigate('ProductForm', { status: 'owned' });
  }

  function retry() {
    if (products.isLoadingError) {
      products.refetch();
    }
    if (steps.isLoadingError) {
      steps.refetch();
    }
  }

  let body;
  if (products.data && steps.data) {
    body = products.data.some((product) => product.status === 'owned') ? (
      <EmptyState
        title="Everything on your shelf is already in both rituals"
        message="Add another product to your shelf first."
        action={{ label: 'Add a product', onPress: addProduct }}
      />
    ) : (
      <EmptyState
        title="Add a product first"
        message="Routine steps use products you own, so start with your shelf."
        action={{ label: 'Add a product', onPress: addProduct }}
      />
    );
  } else if (products.isLoadingError || steps.isLoadingError) {
    body = (
      <ErrorState
        message="We couldn't load your shelf. Check your connection and try again."
        onRetry={retry}
        retrying={products.isFetching || steps.isFetching}
      />
    );
  } else {
    body = <LoadingState />;
  }

  return (
    <Screen edges={['left', 'right']}>
      <FormHeader title="New step" onClose={() => navigation.goBack()} />
      <View style={styles.inset}>{body}</View>
    </Screen>
  );
}

type EditRoutineStepProps = {
  stepId: string;
  navigation: Navigation;
};

// The form reads its starting values once, so it mounts only after the step has loaded.
function EditRoutineStep({ stepId, navigation }: EditRoutineStepProps) {
  const step = useRoutineStep(stepId);

  if (step.data) {
    return <RoutineStepForm navigation={navigation} period={step.data.period} step={step.data} />;
  }

  return (
    <Screen edges={['left', 'right']}>
      <FormHeader title="Edit step" onClose={() => navigation.goBack()} />
      <View style={styles.inset}>
        {step.data === null ? (
          <EmptyState
            title="This step is no longer in your routine"
            message="It may have been removed."
            action={{ label: 'Close', onPress: () => navigation.goBack() }}
          />
        ) : step.isError ? (
          <ErrorState
            message="We couldn't load this step. Check your connection and try again."
            onRetry={() => step.refetch()}
            retrying={step.isFetching}
          />
        ) : (
          <LoadingState />
        )}
      </View>
    </Screen>
  );
}

type RoutineStepFormProps = {
  navigation: Navigation;
  // The ritual New step starts ticked, or the ritual of the step in Edit.
  period: Period;
  // Set in Edit; New step picks a product instead.
  step?: RoutineStep;
  products?: readonly Product[];
};

function RoutineStepForm({ navigation, period, step, products }: RoutineStepFormProps) {
  const { palette } = useDewyTheme();
  const insets = useSafeAreaInsets();
  const formRef = useRef<FormScrollViewHandle>(null);
  // A drag means the user chose the time, so picking a product no longer resets it.
  const timeChosen = useRef(false);
  // isSubmitting and isPending only change on the next render, so two taps in one frame would both send.
  const sending = useRef(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  // Both periods' steps, for the picker, the locks and the step's place; undefined while they load.
  const stepsQuery = useRoutineSteps();
  const steps = stepsQuery.data;
  const addSteps = useAddRoutineSteps();
  const updateStep = useUpdateRoutineStep();
  const removeStep = useRemoveRoutineStep();
  const moveStep = useMoveRoutineStep();

  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    setError,
    clearErrors,
    trigger,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<RoutineStepFormValues, unknown, RoutineStepInput>({
    resolver: zodResolver(routineStepFormSchema),
    defaultValues: step
      ? toRoutineStepFormValues(step)
      : {
          productId: '',
          periods: [period],
          lockedPeriods: [],
          weekdays: everyDay,
          durationSeconds: defaultDurationSeconds,
          waitMinutes: null,
        },
    shouldFocusError: false,
  });

  // Stays busy after a successful save too, so a tap during the closing animation can't save twice.
  const saving = isSubmitting || addSteps.isSuccess || updateStep.isSuccess;
  const removing = removeStep.isPending || removeStep.isSuccess;
  const moveDisabled = moveStep.isPending || removing || saving;
  const ritual = period === 'morning' ? 'Morning' : 'Evening';
  // Numbered by place in the list, as Routines does; positions can have gaps.
  const ritualSteps = steps?.filter((item) => item.period === period) ?? [];
  const place = step ? ritualSteps.findIndex((item) => item.id === step.id) : -1;
  // Read once, like the form's values, so a saved wait can't change the tiles while the editor closes.
  const [waits] = useState(() => waitChoices(step?.waitMinutes ?? null));
  const productId = useWatch({ control, name: 'productId' });
  const ticked = useWatch({ control, name: 'periods' });
  const lockedAtSave = useWatch({ control, name: 'lockedPeriods' });
  // Kept from the tap while saving, so the rituals just saved don't lock as the editor closes.
  const locked = step ? [] : saving ? lockedAtSave : productPeriods(steps ?? [], productId);
  const counted = countedPeriods(ticked, locked);
  const ritualError = step
    ? undefined
    : (errors.periods?.message ??
      (productId && counted.length === 0 ? 'Pick where this step goes.' : undefined));
  // The product, ritual and day controls can't take focus, so a failed save repeats their error by the button.
  const footerError =
    errors.root?.server?.message ??
    (isSubmitted
      ? (errors.productId?.message ?? ritualError ?? errors.weekdays?.message)
      : undefined);
  const addTitle =
    counted.length === 2
      ? 'Add to both rituals'
      : counted[0] === 'morning'
        ? 'Add to morning'
        : counted[0] === 'evening'
          ? 'Add to evening'
          : 'Add to routine';

  // Reads the form's current days, so quick taps that land before a re-render all count.
  function setWeekdays(next: (current: number[]) => number[]) {
    setValue('weekdays', next(getValues('weekdays')), { shouldDirty: true });
    // Shows "Pick at least one day" as soon as the last day is turned off.
    trigger('weekdays');
  }

  // Reads the current ticks like the days; after a failed save the ritual message follows each tap.
  function toggleRitual(toggled: Period) {
    const current = getValues('periods');
    setValue(
      'periods',
      current.includes(toggled)
        ? current.filter((item) => item !== toggled)
        : [...current, toggled],
      { shouldDirty: true, shouldValidate: isSubmitted },
    );
  }

  function pickProduct(product: Product, onChange: (productId: string) => void) {
    onChange(product.id);
    // The new product's rituals decide what counts, and a ritual message was about the old one.
    setValue('lockedPeriods', productPeriods(steps ?? [], product.id));
    clearErrors('periods');
    if (!timeChosen.current) {
      setValue('durationSeconds', categoryDetails[product.category].defaultDurationSeconds);
    }
  }

  async function onSubmit(values: RoutineStepInput) {
    if (step) {
      let saved: RoutineStep | null;
      try {
        saved = await updateStep.mutateAsync({ id: step.id, input: values });
      } catch {
        setError('root.server', {
          message: "We couldn't save your changes. Check your connection and try again.",
        });
        return;
      }
      // Null means it was removed elsewhere, and the screen now says so instead of closing.
      if (saved && navigation.isFocused()) {
        navigation.goBack();
      }
      return;
    }

    try {
      await addSteps.mutateAsync(values);
    } catch (error) {
      const conflict = createStepConflict(error);
      // Another phone added it first, so the reloaded steps say which ritual has it now.
      const nowIn =
        conflict === 'duplicate'
          ? productPeriods((await stepsQuery.refetch()).data ?? [], values.productId)
          : [];
      // A list that failed to reload can't name the ritual, so that case gets the connection message.
      if (nowIn.length === 1 && values.periods.includes(nowIn[0])) {
        setValue('lockedPeriods', nowIn);
        setError('periods', { message: `It's already in your ${nowIn[0]} ritual now.` });
        return;
      }
      if (nowIn.length === 2 || conflict === 'productGone') {
        // The row drops out of the reloaded list, so the next tap asks for another product.
        setValue('productId', '');
        setValue('lockedPeriods', []);
        setError('productId', {
          message:
            conflict === 'productGone'
              ? 'This product is no longer on your shelf.'
              : 'This product is already in both rituals.',
        });
        formRef.current?.scrollToTop();
        return;
      }
      setError('root.server', {
        message: "We couldn't add this step. Check your connection and try again.",
      });
      return;
    }
    if (navigation.isFocused()) {
      navigation.goBack();
    }
  }

  // The product error sits at the top; the days error is already in view by the tiles and the button.
  function onInvalid(fieldErrors: FieldErrors<RoutineStepFormValues>) {
    if (fieldErrors.productId) {
      formRef.current?.scrollToTop();
    }
  }

  function submit() {
    if (saving || removing || sending.current) {
      return;
    }
    if (moveStep.isError) {
      moveStep.reset();
    }
    // The locks follow the latest steps, so a ritual that got the product meanwhile doesn't count.
    if (!step) {
      setValue('lockedPeriods', productPeriods(steps ?? [], getValues('productId')));
    }
    sending.current = true;
    handleSubmit(onSubmit, onInvalid)().finally(() => {
      sending.current = false;
    });
  }

  function move(direction: 'up' | 'down') {
    if (!step || moveDisabled) {
      return;
    }
    moveStep.mutate({
      period,
      stepIds: moveStepIds(
        ritualSteps.map((item) => item.id),
        step.id,
        direction,
      ),
    });
  }

  function openRemove() {
    if (removeStep.isError) {
      removeStep.reset();
    }
    setSheetOpen(true);
  }

  function removeForGood() {
    if (!step || removing || sending.current) {
      return;
    }
    sending.current = true;
    removeStep.mutate(step.id, {
      onSuccess: () => {
        setSheetOpen(false);
        if (navigation.isFocused()) {
          navigation.goBack();
        }
      },
      // Reopens the sheet with its error if it was closed while removing.
      onError: () => {
        sending.current = false;
        setSheetOpen(true);
      },
    });
  }

  const title = step ? splitLastWord(step.product.name) : null;

  return (
    <Screen edges={['left', 'right']}>
      <FormHeader title={step ? 'Edit step' : 'New step'} onClose={() => navigation.goBack()} />

      <FormScrollView
        ref={formRef}
        topOffset={formHeaderBottom}
        contentContainerStyle={styles.content}
      >
        {step && title ? (
          <View style={styles.inset}>
            <Text style={[styles.kicker, { color: palette.textMuted }]}>
              {place >= 0
                ? `${ritual} ritual · step ${place + 1} of ${ritualSteps.length}`
                : `${ritual} ritual`}
            </Text>
            <Text
              accessibilityRole="header"
              style={[styles.title, styles.editTitle, { color: palette.text }]}
            >
              {title.head}
              <Text style={[styles.titleItalic, { color: palette.emphasis }]}>{title.last}</Text>
            </Text>
          </View>
        ) : (
          <Text
            accessibilityRole="header"
            style={[styles.inset, styles.title, { color: palette.text }]}
          >
            Add to your{' '}
            <Text style={[styles.titleItalic, { color: palette.emphasis }]}>routine</Text>
          </Text>
        )}

        {/* The tiles hide while the step is alone, or missing from the list as the editor closes. */}
        {step && place >= 0 && (ritualSteps.length > 1 || moveStep.isError) ? (
          <View style={styles.inset}>
            {ritualSteps.length > 1 ? (
              <View style={styles.moveRow}>
                <MoveButton
                  direction="up"
                  disabled={moveDisabled || place === 0}
                  onPress={() => move('up')}
                />
                <MoveButton
                  direction="down"
                  disabled={moveDisabled || place === ritualSteps.length - 1}
                  onPress={() => move('down')}
                />
              </View>
            ) : null}
            {moveStep.isError ? (
              <FieldError style={styles.moveError}>
                We couldn&apos;t move this step. Try again.
              </FieldError>
            ) : null}
          </View>
        ) : null}

        {step ? null : (
          <View style={styles.inset}>
            <Text style={[styles.label, { color: palette.text }]}>Product</Text>
            {errors.productId ? (
              <FieldError style={styles.productError}>{errors.productId.message}</FieldError>
            ) : null}
            <View style={styles.picker}>
              <Controller
                control={control}
                name="productId"
                render={({ field }) => (
                  <ProductPicker
                    products={pickableProducts(products ?? [], steps ?? [], field.value)}
                    value={field.value}
                    onChange={(product) => pickProduct(product, field.onChange)}
                    disabled={saving}
                  />
                )}
              />
            </View>
          </View>
        )}

        {step ? null : (
          <View style={styles.inset}>
            <RitualTiles
              ticked={ticked}
              locked={locked}
              onToggle={toggleRitual}
              error={ritualError}
              disabled={saving}
            />
          </View>
        )}

        <View style={styles.inset}>
          <Controller
            control={control}
            name="weekdays"
            render={({ field, fieldState }) => (
              <WeekdaySelector
                period={counted.length === 1 && counted[0] === 'evening' ? 'evening' : 'morning'}
                value={field.value}
                onToggleDay={(day) =>
                  setWeekdays((current) =>
                    current.includes(day)
                      ? current.filter((item) => item !== day)
                      : [...current, day],
                  )
                }
                onEveryDay={() => setWeekdays(() => everyDay)}
                error={fieldState.error?.message}
                disabled={saving}
              />
            )}
          />
        </View>

        <View style={styles.inset}>
          <Controller
            control={control}
            name="durationSeconds"
            render={({ field }) => (
              <View>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: palette.text }]}>Time</Text>
                  <Text style={[styles.timeValue, { color: palette.text }]}>
                    {formatDuration(field.value)}
                  </Text>
                </View>
                {/* TalkBack gets one stop per swipe and hears "45 sec", where the slider itself says a percent. */}
                <View
                  accessible
                  accessibilityRole="adjustable"
                  accessibilityLabel="Time"
                  accessibilityValue={{ text: formatDuration(field.value) }}
                  accessibilityState={{ disabled: saving }}
                  accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
                  onAccessibilityAction={(event) => {
                    const step = event.nativeEvent.actionName === 'increment' ? 1 : -1;
                    const next = nearestDurationStop(field.value) + step;
                    if (saving || next < 0 || next >= durationStops.length) {
                      return;
                    }
                    timeChosen.current = true;
                    field.onChange(durationStops[next]);
                  }}
                >
                  {/* The slider ignores a value of 0, so its stops are numbered from 1. */}
                  <Slider
                    importantForAccessibility="no-hide-descendants"
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={durationStops.length}
                    step={1}
                    value={nearestDurationStop(field.value) + 1}
                    onValueChange={(stop) => {
                      timeChosen.current = true;
                      field.onChange(durationStops[Math.round(stop) - 1]);
                    }}
                    minimumTrackTintColor={palette.rose}
                    maximumTrackTintColor={palette.textMuted}
                    thumbTintColor={palette.primary}
                    disabled={saving}
                  />
                </View>
                <View style={styles.sliderEnds}>
                  <Text style={[styles.sliderEnd, { color: palette.textMuted }]}>
                    {formatDuration(durationStops[0])}
                  </Text>
                  <Text style={[styles.sliderEnd, { color: palette.textMuted }]}>
                    {formatDuration(durationStops[durationStops.length - 1])}
                  </Text>
                </View>
              </View>
            )}
          />
        </View>

        <View style={styles.inset}>
          <Text style={[styles.label, { color: palette.text }]}>Wait before the next step</Text>
          <Controller
            control={control}
            name="waitMinutes"
            render={({ field }) => (
              <View style={styles.waitTiles}>
                {[null, ...waits].map((minutes) => {
                  const selected = field.value === minutes;
                  return (
                    <Pressable
                      key={minutes ?? 'none'}
                      accessibilityRole="button"
                      accessibilityLabel={
                        minutes === null
                          ? 'No wait'
                          : `Wait ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
                      }
                      accessibilityState={{ selected, disabled: saving }}
                      disabled={saving}
                      hitSlop={tileSlop}
                      onPress={() => field.onChange(minutes)}
                      style={[
                        styles.waitTile,
                        { backgroundColor: selected ? palette.rose : palette.surface },
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={[
                          styles.waitLabel,
                          { color: selected ? palette.onAccent : palette.text },
                        ]}
                      >
                        {minutes === null ? 'None' : `${minutes} min`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
        </View>

        {step ? (
          <View style={styles.inset}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove step"
              accessibilityState={{ disabled: saving || moveStep.isPending }}
              disabled={saving || moveStep.isPending}
              onPress={openRemove}
              style={({ pressed }) => [
                styles.removeRow,
                { opacity: saving || moveStep.isPending ? 0.4 : pressed ? 0.6 : 1 },
              ]}
            >
              <Feather name="trash-2" size={18} color={palette.warning} />
              <Text style={[styles.removeLabel, { color: palette.warning }]}>Remove step</Text>
            </Pressable>
          </View>
        ) : null}
      </FormScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom + spacing.xs, MIN_BOTTOM_SPACE) },
        ]}
      >
        {footerError ? (
          <Text
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[styles.formError, { color: palette.warning }]}
          >
            {footerError}
          </Text>
        ) : null}
        <AppButton
          pinned
          title={step ? 'Save changes' : addTitle}
          loading={saving}
          disabled={removing}
          onPress={submit}
        />
      </View>

      {step && sheetOpen ? (
        <RemoveStepSheet
          productName={step.product.name}
          period={period}
          removing={removing}
          failed={removeStep.isError}
          onClose={() => setSheetOpen(false)}
          onRemove={removeForGood}
        />
      ) : null}
    </Screen>
  );
}

type MoveButtonProps = {
  direction: 'up' | 'down';
  disabled: boolean;
  onPress: () => void;
};

// The Take photo / Choose photo tile, with an arrow.
function MoveButton({ direction, disabled, onPress }: MoveButtonProps) {
  const { palette } = useDewyTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={direction === 'up' ? 'Move up' : 'Move down'}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.moveButton,
        { backgroundColor: palette.surface, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
      ]}
    >
      <Feather
        name={direction === 'up' ? 'arrow-up' : 'arrow-down'}
        size={16}
        color={palette.text}
      />
      <Text style={[styles.moveLabel, { color: palette.text }]}>
        {direction === 'up' ? 'Move up' : 'Move down'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 18,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.screen,
  },
  inset: {
    paddingHorizontal: spacing.screen,
  },
  kicker: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.kicker,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  title: {
    overflow: 'visible',
    fontFamily: fonts.display,
    fontSize: fontSizes.formTitle,
    lineHeight: fontSizes.formTitle * 1.1,
    letterSpacing: letterSpacings.title,
  },
  editTitle: {
    marginTop: spacing.snug,
  },
  titleItalic: {
    fontFamily: fonts.displayItalic,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.meta,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productError: {
    marginTop: spacing.snug,
  },
  picker: {
    marginTop: spacing.xs,
  },
  moveRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  moveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radii.tile,
  },
  moveLabel: {
    flexShrink: 1,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.secondary,
  },
  moveError: {
    marginTop: spacing.xs,
  },
  timeValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.secondary,
  },
  slider: {
    height: minTouchTarget,
    marginTop: spacing.xxs,
  },
  sliderEnds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderEnd: {
    fontFamily: fonts.body,
    fontSize: fontSizes.kicker,
  },
  waitTiles: {
    flexDirection: 'row',
    gap: spacing.snug,
    marginTop: spacing.xs,
  },
  waitTile: {
    flex: 1,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxs,
    borderRadius: radii.tile,
  },
  waitLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.secondary,
  },
  removeRow: {
    minHeight: minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  removeLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.secondary,
  },
  footer: {
    gap: spacing.xs,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.screen,
  },
  formError: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.meta,
  },
});
