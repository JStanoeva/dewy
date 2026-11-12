import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import { Controller, useForm, useWatch, type FieldErrors } from 'react-hook-form';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { DateField } from '@/components/DateField';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { FormScrollView, type FormScrollViewHandle } from '@/components/FormScrollView';
import { FormTextField } from '@/components/FormTextField';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { BarcodeCard } from '@/features/products/components/BarcodeCard';
import { CategoryChips, categoryOptions } from '@/features/products/components/CategoryChips';
import { CloseIcon } from '@/features/products/components/CloseIcon';
import { IngredientChips } from '@/features/products/components/IngredientChips';
import { paoMonthsOptions, type Category } from '@/features/products/constants';
import { useCreateProduct, useUpdateProduct } from '@/features/products/hooks/useProductMutations';
import { useProduct } from '@/features/products/hooks/useProducts';
import {
  earliestOpenedOn,
  parseIngredients,
  productFormSchema,
  toProductFormValues,
  type ProductFormValues,
  type ProductInput,
} from '@/features/products/schemas/productSchema';
import type { Product, ProductStatus } from '@/features/products/types';
import type { RootStackParamList } from '@/navigation/types';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, letterSpacings, minTouchTarget, radii, spacing } from '@/theme/tokens';
import { parseLocalDate, todayLocalDate } from '@/utils/localDate';

type ProductFormScreenProps = NativeStackScreenProps<RootStackParamList, 'ProductForm'>;

const statusOptions = [
  { value: 'owned', label: 'I own it' },
  { value: 'wishlist', label: 'Wishlist' },
] as const;

const fieldOrder = [
  'barcode',
  'name',
  'brand',
  'category',
  'openedOn',
  'paoMonths',
  'ingredients',
  'notes',
] as const;

// The header row sits at the artboard's y 48 and is 44 high, so the form scrolls from y 92.
const headerTop = 48;
const headerHeight = 44;
// The design leaves 28 under the button for the system bar; taller insets get a small gap instead.
const MIN_BOTTOM_SPACE = 28;

const earliestOpenedDate = parseLocalDate(earliestOpenedOn);

// Half the 6dp gap on each side keeps the tiles 44 wide on a 360dp phone without overlapping.
const paoTileSlop = { left: spacing.snug / 2, right: spacing.snug / 2 };
// The slop stays inside the 8dp gap above and the 18dp gap below, so it never takes the date field's taps.
const notOpenedSlop = { top: spacing.xs, bottom: 18, left: spacing.lg, right: spacing.lg };

export function ProductFormScreen({ navigation, route }: ProductFormScreenProps) {
  const productId = route.params?.productId;
  const scannedBarcode = route.params?.barcode;
  if (productId) {
    return (
      <EditProduct productId={productId} navigation={navigation} scannedBarcode={scannedBarcode} />
    );
  }
  return (
    <ProductForm
      navigation={navigation}
      status={route.params?.status}
      category={route.params?.category}
      scannedBarcode={scannedBarcode}
    />
  );
}

type EditProductProps = {
  productId: string;
  navigation: ProductFormScreenProps['navigation'];
  scannedBarcode?: string;
};

// The form reads its starting values once, so it mounts only after the product has loaded.
function EditProduct({ productId, navigation, scannedBarcode }: EditProductProps) {
  const product = useProduct(productId);

  if (product.data) {
    return (
      <ProductForm navigation={navigation} product={product.data} scannedBarcode={scannedBarcode} />
    );
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
  // Set by the scanner through the route params.
  scannedBarcode?: string;
};

function ProductForm({
  navigation,
  product,
  status: initialStatus,
  category,
  scannedBarcode,
}: ProductFormProps) {
  const { palette } = useDewyTheme();
  const insets = useSafeAreaInsets();
  const formRef = useRef<FormScrollViewHandle>(null);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const {
    control,
    handleSubmit,
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
          // Required: without the key the schema would block every save with no visible error.
          barcode: null,
          name: '',
          brand: '',
          category,
          openedOn: todayLocalDate(),
          paoMonths: null,
          ingredients: '',
          notes: '',
        },
    shouldFocusError: false,
  });
  const status = useWatch({ control, name: 'status' });
  const barcode = useWatch({ control, name: 'barcode' });
  const openedOn = useWatch({ control, name: 'openedOn' });
  const ingredientPreview = parseIngredients(useWatch({ control, name: 'ingredients' }));
  const isOwned = status === 'owned';
  // Stays busy after a successful save too, so a tap during the closing animation can't save twice.
  const saving = isSubmitting || createProduct.isSuccess || updateProduct.isSuccess;

  // Clearing the param lets the same code arrive again after it was removed.
  useEffect(() => {
    if (scannedBarcode) {
      setValue('barcode', scannedBarcode);
      clearErrors('barcode');
      navigation.setParams({ barcode: undefined });
    }
  }, [scannedBarcode, navigation, setValue, clearErrors]);

  function revealFocusedField() {
    formRef.current?.revealFocusedField();
  }

  // The keyboard would otherwise stay up over the camera, because the form keeps taps while it shows.
  function openScanner() {
    Keyboard.dismiss();
    navigation.navigate('BarcodeScanner');
  }

  function removeBarcode() {
    setValue('barcode', null);
    clearErrors('barcode');
  }

  async function onSubmit(values: ProductInput) {
    try {
      if (product) {
        await updateProduct.mutateAsync({ id: product.id, input: values });
      } else {
        await createProduct.mutateAsync(values);
      }
      if (navigation.isFocused()) {
        navigation.goBack();
      }
    } catch {
      setError('root.server', {
        message: "We couldn't save this product. Check your connection and try again.",
      });
    }
  }

  // Text fields take focus on error; the type, date and PAO controls can't, so scroll up to them.
  function onInvalid(fieldErrors: FieldErrors<ProductFormValues>) {
    const first = fieldOrder.find((name) => fieldErrors[name]);
    if (first === 'name' || first === 'brand' || first === 'ingredients' || first === 'notes') {
      // Android's back key hides the keyboard but keeps focus, and focusing a focused field does nothing.
      Keyboard.dismiss();
      setFocus(first);
    } else {
      formRef.current?.scrollToTop();
    }
  }

  function submit() {
    if (!saving) {
      handleSubmit(onSubmit, onInvalid)();
    }
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
        topOffset={headerTop + headerHeight}
        contentContainerStyle={styles.content}
      >
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

        {/* Disabled while saving: a scan that lands after the save would leave the form unable to close. */}
        <View style={styles.inset}>
          <BarcodeCard
            barcode={barcode}
            error={errors.barcode?.message}
            disabled={saving}
            onScan={openScanner}
            onRemove={removeBarcode}
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
                onSubmitEditing={() => setFocus('ingredients')}
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

        <View style={styles.inset}>
          <Controller
            control={control}
            name="ingredients"
            render={({ field, fieldState }) => (
              <FormTextField
                ref={field.ref}
                label="Key ingredients"
                placeholder="Niacinamide, ceramides"
                returnKeyType="next"
                submitBehavior="submit"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                onFocus={revealFocusedField}
                onSubmitEditing={() => setFocus('notes')}
                error={fieldState.error?.message}
              />
            )}
          />
          {ingredientPreview.length > 0 ? (
            <IngredientChips ingredients={ingredientPreview} />
          ) : null}
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

function FieldError({
  children,
  style,
}: {
  children: string | undefined;
  style?: StyleProp<TextStyle>;
}) {
  const { palette } = useDewyTheme();
  return (
    <Text
      accessibilityLiveRegion="polite"
      style={[styles.fieldError, { color: palette.warning }, style]}
    >
      {children}
    </Text>
  );
}

function FormHeader({ title, onClose }: { title: string; onClose: () => void }) {
  const { palette } = useDewyTheme();
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={onClose}
        style={({ pressed }) => [
          styles.iconButton,
          {
            backgroundColor: palette.surface,
            boxShadow: palette.iconButtonShadow,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <CloseIcon color={palette.text} />
      </Pressable>
      <Text style={[styles.headerTitle, { color: palette.text }]}>{title}</Text>
      <View style={styles.iconButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: headerTop,
    height: headerHeight,
    paddingHorizontal: spacing.xxl,
  },
  iconButton: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.body,
  },
  content: {
    gap: 18,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.screen,
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
  fieldError: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.meta,
  },
  formError: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.meta,
  },
});
