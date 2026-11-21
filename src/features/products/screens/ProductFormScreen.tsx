import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { randomUUID } from 'expo-crypto';
import { useRef, useState } from 'react';
import { Controller, useForm, useWatch, type FieldErrors } from 'react-hook-form';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { DateField } from '@/components/DateField';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { FieldError } from '@/components/FieldError';
import { FormHeader, formHeaderBottom } from '@/components/FormHeader';
import { FormScrollView, type FormScrollViewHandle } from '@/components/FormScrollView';
import { FormTextField } from '@/components/FormTextField';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { ActivePicker } from '@/features/products/components/ActivePicker';
import { AmountEstimateCard } from '@/features/products/components/AmountEstimateCard';
import { CategoryChips, categoryOptions } from '@/features/products/components/CategoryChips';
import { FullnessTiles } from '@/features/products/components/FullnessTiles';
import { PackagingPicker } from '@/features/products/components/PackagingPicker';
import {
  ProductPhotoField,
  type LabelStatus,
} from '@/features/products/components/ProductPhotoField';
import { SizeField } from '@/features/products/components/SizeField';
import { categoryDetails, paoMonthsOptions, type Category } from '@/features/products/constants';
import {
  useCreateProduct,
  useReadProductLabel,
  useUpdateProduct,
  useUploadProductPhoto,
} from '@/features/products/hooks/useProductMutations';
import { useProduct, useProductUses } from '@/features/products/hooks/useProducts';
import {
  earliestOpenedOn,
  productFormSchema,
  toProductFormValues,
  toSizeMl,
  type LabelReading,
  type ProductFormValues,
  type ProductInput,
} from '@/features/products/schemas/productSchema';
import type { Product, ProductPhotoValue, ProductStatus } from '@/features/products/types';
import { restartsCount } from '@/features/products/utils/usesLeft';
import type { RootStackParamList } from '@/navigation/types';
import { getRitualDate } from '@/theme/period';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, letterSpacings, minTouchTarget, radii, spacing } from '@/theme/tokens';
import { parseLocalDate, todayLocalDate } from '@/utils/localDate';

type ProductFormScreenProps = NativeStackScreenProps<RootStackParamList, 'ProductForm'>;

const statusOptions = [
  { value: 'owned', label: 'I own it' },
  { value: 'wishlist', label: 'Wishlist' },
] as const;

const fieldOrder = [
  'name',
  'brand',
  'category',
  'openedOn',
  'paoMonths',
  'sizeMl',
  'notes',
] as const;

// The design leaves 28 under the button for the system bar; taller insets get a small gap instead.
const MIN_BOTTOM_SPACE = 28;

const earliestOpenedDate = parseLocalDate(earliestOpenedOn);

// Half the 6dp gap on each side keeps the tiles 44 wide on a 360dp phone without overlapping.
const paoTileSlop = { left: spacing.snug / 2, right: spacing.snug / 2 };
// The slop stays inside the 8dp gap above and the 18dp gap below, so it never takes the date field's taps.
const notOpenedSlop = { top: spacing.xs, bottom: 18, left: spacing.lg, right: spacing.lg };

export function ProductFormScreen({ navigation, route }: ProductFormScreenProps) {
  const productId = route.params?.productId;
  if (productId) {
    return <EditProduct productId={productId} navigation={navigation} />;
  }
  return (
    <ProductForm
      navigation={navigation}
      status={route.params?.status}
      category={route.params?.category}
    />
  );
}

type EditProductProps = {
  productId: string;
  navigation: ProductFormScreenProps['navigation'];
};

// The form reads its starting values once, so it mounts only after the product has loaded.
function EditProduct({ productId, navigation }: EditProductProps) {
  const product = useProduct(productId);

  if (product.data) {
    return <ProductForm navigation={navigation} product={product.data} />;
  }

  return (
    <Screen edges={['left', 'right']}>
      <FormHeader title="Edit product" onClose={() => navigation.goBack()} />
      <View style={styles.inset}>
        {product.data === null ? (
          <EmptyState
            title="This product is no longer on your shelf"
            message="It may have been deleted."
            action={{ label: 'Close', onPress: () => navigation.goBack() }}
          />
        ) : product.isError ? (
          <ErrorState
            message="We couldn't load this product. Check your connection and try again."
            onRetry={() => product.refetch()}
            retrying={product.isFetching}
          />
        ) : (
          <LoadingState />
        )}
      </View>
    </Screen>
  );
}

type ProductFormProps = {
  navigation: ProductFormScreenProps['navigation'];
  product?: Product;
  status?: ProductStatus;
  category?: Category;
};

// Null when the label had nothing new, or label reading is switched off: the line then stays blank.
type LabelOutcome = 'filled' | 'unread' | null;

function ProductForm({ navigation, product, status: initialStatus, category }: ProductFormProps) {
  const { palette } = useDewyTheme();
  const insets = useSafeAreaInsets();
  const formRef = useRef<FormScrollViewHandle>(null);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const uploadPhoto = useUploadProductPhoto();
  const readLabel = useReadProductLabel();
  const [photo, setPhoto] = useState<ProductPhotoValue | null>(
    product?.photoPath ? { kind: 'stored', path: product.photoPath } : null,
  );
  const [labelOutcome, setLabelOutcome] = useState<LabelOutcome>(null);
  // A retry after a failed save reuses the photo that already uploaded instead of sending it again.
  const uploaded = useRef<{ uri: string; path: string } | null>(null);
  // isSubmitting only changes on the next render, so two taps in one frame would both save.
  const submitting = useRef(false);
  // Every Save of one New product form sends the same id, so a retry can't add a second product.
  const [newProductId] = useState(randomUUID);

  const {
    control,
    handleSubmit,
    getValues,
    setError,
    setFocus,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues, unknown, ProductInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product
      ? toProductFormValues(product)
      : {
          status: initialStatus ?? 'owned',
          name: '',
          brand: '',
          category,
          packaging: null,
          openedOn: todayLocalDate(),
          paoMonths: null,
          sizeMl: '',
          startFraction: 1,
          actives: [],
          notes: '',
        },
    shouldFocusError: false,
  });
  const status = useWatch({ control, name: 'status' });
  const openedOn = useWatch({ control, name: 'openedOn' });
  const pickedCategory = useWatch({ control, name: 'category' });
  const typedSize = toSizeMl(useWatch({ control, name: 'sizeMl' }));
  const pickedFraction = useWatch({ control, name: 'startFraction' });
  const productUses = useProductUses();
  // In Edit with no tile picked the count carries on: the saved fullness, minus the uses already ticked.
  const estimateFullness = pickedFraction ?? product?.startFraction ?? 1;
  let countedUses: number | 'counting' | 'failed' | undefined;
  if (product && pickedFraction === null) {
    if (productUses.data) {
      countedUses = productUses.data[product.id] ?? 0;
    } else {
      countedUses = productUses.isError ? 'failed' : 'counting';
    }
  }
  const isOwned = status === 'owned';
  // Stays busy after a successful save too, so a tap during the closing animation can't save twice.
  const saving = isSubmitting || createProduct.isSuccess || updateProduct.isSuccess;
  let labelStatus: LabelStatus | undefined;
  if (!product && photo?.kind === 'new') {
    labelStatus = readLabel.isPending ? 'reading' : (labelOutcome ?? 'idle');
  }

  function revealFocusedField() {
    formRef.current?.revealFocusedField();
  }

  // Checked when the answer arrives, so a field typed into during the read is never overwritten.
  function fillEmptyFields(reading: LabelReading | null): LabelOutcome {
    if (!reading) {
      return null;
    }
    const { name, brand, category, packaging, sizeMl } = reading;
    if (!name && !brand && !category && !packaging && sizeMl === null && !reading.actives.length) {
      return 'unread';
    }
    let filled = false;
    if (name && !getValues('name').trim()) {
      setValue('name', name, { shouldValidate: true });
      filled = true;
    }
    if (brand && !getValues('brand').trim()) {
      setValue('brand', brand, { shouldValidate: true });
      filled = true;
    }
    if (category && !getValues('category')) {
      setValue('category', category, { shouldValidate: true });
      filled = true;
    }
    // A filled packaging counts as picked, so a later Type change keeps it.
    if (packaging && getValues('packaging') === null) {
      setValue('packaging', packaging);
      filled = true;
    }
    if (sizeMl !== null && getValues('status') === 'owned' && !getValues('sizeMl').trim()) {
      setValue('sizeMl', String(sizeMl), { shouldValidate: true });
      filled = true;
    }
    if (reading.actives.length && !getValues('actives').length) {
      setValue('actives', reading.actives);
      filled = true;
    }
    return filled ? 'filled' : null;
  }

  // reset() drops the previous read's callbacks, so only the latest photo's answer can fill the form.
  function changePhoto(next: ProductPhotoValue | null) {
    setPhoto(next);
    readLabel.reset();
    setLabelOutcome(null);
    if (!product && next?.kind === 'new') {
      readLabel.mutate(next.uri, {
        onSuccess: (reading) => setLabelOutcome(fillEmptyFields(reading)),
        onError: () => setLabelOutcome('unread'),
      });
    }
  }

  async function photoPathToSave() {
    if (photo === null || photo.kind === 'stored') {
      return photo?.path ?? null;
    }
    if (uploaded.current?.uri === photo.uri) {
      return uploaded.current.path;
    }
    const path = await uploadPhoto.mutateAsync(photo.uri);
    uploaded.current = { uri: photo.uri, path };
    return path;
  }

  // The photo uploads first, so a failed upload saves nothing and the product is never half-saved.
  async function onSubmit(values: ProductInput) {
    // Runs only after validation passes, so a read still going can't change the form while it saves.
    readLabel.reset();
    // The fields lock while saving, so typing can't go on in a field the save has already read.
    Keyboard.dismiss();
    // Taken at save time, so a save just after the 05:00 rollover counts from the new ritual day.
    const ritualDate = getRitualDate();
    try {
      const photoPath = await photoPathToSave();
      if (product) {
        await updateProduct.mutateAsync({
          id: product.id,
          input: values,
          photoPath,
          previousPhotoPath: product.photoPath,
          trackedFrom: restartsCount(values) ? ritualDate : null,
        });
      } else {
        await createProduct.mutateAsync({
          id: newProductId,
          input: values,
          photoPath,
          trackedFrom: ritualDate,
        });
      }
    } catch {
      setError('root.server', {
        message: "We couldn't save this product. Check your connection and try again.",
      });
      return;
    }
    if (navigation.isFocused()) {
      navigation.goBack();
    }
  }

  // Text fields take focus on error; the type, date and PAO controls can't, so scroll up to them.
  function onInvalid(fieldErrors: FieldErrors<ProductFormValues>) {
    const first = fieldOrder.find((name) => fieldErrors[name]);
    if (first === 'name' || first === 'brand' || first === 'sizeMl' || first === 'notes') {
      // Android's back key hides the keyboard but keeps focus, and focusing a focused field does nothing.
      Keyboard.dismiss();
      setFocus(first);
    } else {
      formRef.current?.scrollToTop();
    }
  }

  function submit() {
    if (saving || submitting.current) {
      return;
    }
    submitting.current = true;
    handleSubmit(onSubmit, onInvalid)().finally(() => {
      submitting.current = false;
    });
  }

  function markNotOpened() {
    setValue('openedOn', null);
    clearErrors(['openedOn', 'paoMonths']);
  }

  return (
    <Screen edges={['left', 'right']}>
      <FormHeader
        title={product ? 'Edit product' : 'New product'}
        onClose={() => navigation.goBack()}
      />

      <FormScrollView
        ref={formRef}
        topOffset={formHeaderBottom}
        contentContainerStyle={styles.content}
      >
        <View pointerEvents={saving ? 'none' : 'auto'} style={styles.fields}>
          <Text
            accessibilityRole="header"
            style={[styles.inset, styles.title, { color: palette.text }]}
          >
            What&apos;s on your{' '}
            <Text style={[styles.titleItalic, { color: palette.emphasis }]}>shelf?</Text>
          </Text>

          {/* Editing never changes the status; only Move to shelf does. */}
          {product ? null : (
            <View style={styles.inset}>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <SegmentedControl
                    options={statusOptions}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </View>
          )}

          <View style={styles.inset}>
            <ProductPhotoField
              value={photo}
              onChange={changePhoto}
              disabled={saving}
              labelStatus={labelStatus}
            />
          </View>

          <View style={[styles.inset, styles.nameRow]}>
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <FormTextField
                  ref={field.ref}
                  style={styles.half}
                  label="Product name"
                  placeholder="Hydrating Toner"
                  returnKeyType="next"
                  submitBehavior="submit"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  onFocus={revealFocusedField}
                  onSubmitEditing={() => setFocus('brand')}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="brand"
              render={({ field, fieldState }) => (
                <FormTextField
                  ref={field.ref}
                  style={styles.half}
                  label="Brand"
                  placeholder="Brand name"
                  autoCapitalize="words"
                  returnKeyType="next"
                  submitBehavior="submit"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  onFocus={revealFocusedField}
                  onSubmitEditing={() => setFocus(isOwned ? 'sizeMl' : 'notes')}
                  error={fieldState.error?.message}
                />
              )}
            />
          </View>

          <View>
            <Text style={[styles.inset, styles.label, { color: palette.text }]}>Type</Text>
            <Controller
              control={control}
              name="category"
              render={({ field, fieldState }) => (
                <>
                  <View style={styles.chips}>
                    <CategoryChips
                      options={categoryOptions}
                      value={field.value}
                      onChange={field.onChange}
                      shadow={false}
                    />
                  </View>
                  {fieldState.error ? (
                    <FieldError style={[styles.inset, styles.chipsError]}>
                      {fieldState.error.message}
                    </FieldError>
                  ) : null}
                </>
              )}
            />
          </View>

          <View style={[styles.inset, styles.packaging]}>
            <Text style={[styles.label, { color: palette.text }]}>
              Packaging
              <Text style={[styles.labelHint, { color: palette.textMuted }]}>
                {" · shown when there's no photo"}
              </Text>
            </Text>
            <Controller
              control={control}
              name="packaging"
              render={({ field }) => (
                <PackagingPicker
                  value={
                    field.value ?? (pickedCategory ? categoryDetails[pickedCategory].bottle : null)
                  }
                  onChange={field.onChange}
                />
              )}
            />
          </View>

          {isOwned ? (
            <View style={styles.inset}>
              <View style={styles.openedRow}>
                <Controller
                  control={control}
                  name="openedOn"
                  render={({ field, fieldState }) => (
                    <DateField
                      style={styles.dateColumn}
                      label="Opened on"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Not opened"
                      minimumDate={earliestOpenedDate}
                      maximumDate={new Date()}
                      invalid={fieldState.error !== undefined}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="paoMonths"
                  render={({ field }) => (
                    <View style={styles.paoColumn}>
                      <Text style={[styles.label, { color: palette.text }]}>Use within</Text>
                      <View style={styles.paoGrid}>
                        {paoMonthsOptions.map((months) => {
                          const selected = field.value === months;
                          return (
                            <Pressable
                              key={months}
                              accessibilityRole="button"
                              hitSlop={paoTileSlop}
                              accessibilityLabel={`Use within ${months} months`}
                              accessibilityState={{ selected }}
                              onPress={() => field.onChange(months)}
                              style={[
                                styles.paoTile,
                                { backgroundColor: selected ? palette.rose : palette.surface },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.paoLabel,
                                  { color: selected ? palette.onAccent : palette.text },
                                ]}
                              >
                                {months}M
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  )}
                />
              </View>
              {errors.openedOn ? (
                <FieldError style={styles.rowError}>{errors.openedOn.message}</FieldError>
              ) : null}
              {errors.paoMonths ? (
                <FieldError style={styles.rowError}>{errors.paoMonths.message}</FieldError>
              ) : null}
              {openedOn ? (
                <Pressable
                  accessibilityRole="button"
                  hitSlop={notOpenedSlop}
                  onPress={markNotOpened}
                  style={styles.notOpened}
                >
                  <Text style={[styles.label, { color: palette.emphasis }]}>Not opened yet</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {isOwned ? (
            <View style={styles.inset}>
              <View style={styles.openedRow}>
                <Controller
                  control={control}
                  name="sizeMl"
                  render={({ field, fieldState }) => (
                    <SizeField
                      ref={field.ref}
                      style={styles.sizeColumn}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      onFocus={revealFocusedField}
                      onSubmitEditing={() => setFocus('notes')}
                      invalid={fieldState.error !== undefined}
                    />
                  )}
                />
                <View style={styles.fullnessColumn}>
                  <Text style={[styles.label, { color: palette.text }]}>How full is it?</Text>
                  <Controller
                    control={control}
                    name="startFraction"
                    render={({ field }) => (
                      <FullnessTiles
                        value={field.value}
                        onChange={field.onChange}
                        unselectedColor={palette.surface}
                        hitSlop={paoTileSlop}
                      />
                    )}
                  />
                </View>
              </View>
              {errors.sizeMl ? (
                <FieldError style={styles.rowError}>{errors.sizeMl.message}</FieldError>
              ) : null}
            </View>
          ) : null}

          {isOwned ? (
            <View style={styles.inset}>
              <AmountEstimateCard
                sizeMl={typedSize}
                fullness={estimateFullness}
                category={pickedCategory}
                counted={countedUses}
              />
            </View>
          ) : null}

          <View style={[styles.inset, styles.actives]}>
            <Text style={[styles.label, { color: palette.text }]}>
              Key actives
              <Text style={[styles.labelHint, { color: palette.textMuted }]}>
                {' · pick any it contains'}
              </Text>
            </Text>
            <Controller
              control={control}
              name="actives"
              render={({ field }) => <ActivePicker value={field.value} onChange={field.onChange} />}
            />
            <Text style={[styles.activesHelp, { color: palette.textMuted }]}>
              Dewy uses these to flag clashes in your rituals, like a retinoid and acids on the same
              night.
            </Text>
          </View>

          <View style={styles.inset}>
            <Controller
              control={control}
              name="notes"
              render={({ field, fieldState }) => (
                <FormTextField
                  ref={field.ref}
                  label="Notes"
                  placeholder="One note per line"
                  multiline
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  onFocus={revealFocusedField}
                  error={fieldState.error?.message}
                />
              )}
            />
          </View>
        </View>
      </FormScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom + spacing.xs, MIN_BOTTOM_SPACE) },
        ]}
      >
        {errors.root?.server ? (
          <Text
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[styles.formError, { color: palette.warning }]}
          >
            {errors.root.server.message}
          </Text>
        ) : null}
        <AppButton
          pinned
          title={product ? 'Save changes' : isOwned ? 'Save to shelf' : 'Save to wishlist'}
          loading={saving}
          onPress={submit}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.screen,
  },
  fields: {
    gap: 18,
  },
  inset: {
    paddingHorizontal: spacing.screen,
  },
  title: {
    overflow: 'visible',
    fontFamily: fonts.display,
    fontSize: fontSizes.formTitle,
    lineHeight: fontSizes.formTitle * 1.1,
    letterSpacing: letterSpacings.title,
  },
  titleItalic: {
    fontFamily: fonts.displayItalic,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  half: {
    flex: 1,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.meta,
  },
  labelHint: {
    fontFamily: fonts.bodyMedium,
  },
  packaging: {
    gap: spacing.xs,
  },
  chips: {
    marginTop: spacing.xs,
  },
  chipsError: {
    marginTop: spacing.snug,
  },
  openedRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  dateColumn: {
    width: 128,
  },
  paoColumn: {
    flex: 1,
    gap: spacing.snug,
  },
  sizeColumn: {
    width: 128,
  },
  fullnessColumn: {
    flex: 1,
    minWidth: 0,
    gap: spacing.snug,
  },
  actives: {
    gap: spacing.xs,
  },
  activesHelp: {
    fontFamily: fonts.body,
    fontSize: fontSizes.meta,
    lineHeight: 18.2,
  },
  paoGrid: {
    flexDirection: 'row',
    gap: spacing.snug,
  },
  paoTile: {
    flex: 1,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.tile,
  },
  paoLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.secondary,
  },
  rowError: {
    marginTop: spacing.snug,
  },
  // 18 tall plus the 8 + 18 slop above and below makes a 44 target that fits the gaps exactly.
  notOpened: {
    alignSelf: 'flex-start',
    minHeight: 18,
    justifyContent: 'center',
    marginTop: spacing.xs,
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
