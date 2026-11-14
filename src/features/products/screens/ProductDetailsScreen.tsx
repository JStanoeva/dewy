import Feather from '@expo/vector-icons/Feather';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { BottleIllustration } from '@/components/BottleIllustration';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { IngredientChips } from '@/features/products/components/IngredientChips';
import { ProductActionsSheet } from '@/features/products/components/ProductActionsSheet';
import { ProductPhoto } from '@/features/products/components/ProductPhoto';
import { ShelfLifeCard } from '@/features/products/components/ShelfLifeCard';
import { categoryDetails } from '@/features/products/constants';
import {
  useDeleteProduct,
  useMoveToShelf,
  useSetFavorite,
} from '@/features/products/hooks/useProductMutations';
import { useProduct } from '@/features/products/hooks/useProducts';
import type { Product } from '@/features/products/types';
import { noteLines, productInitials, splitLastWord } from '@/features/products/utils/productLabels';
import { useLocalToday } from '@/hooks/useLocalToday';
import type { RootStackParamList } from '@/navigation/types';
import { bottleColorsFor, photoScrim } from '@/theme/bottleColors';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, letterSpacings, minTouchTarget, radii, spacing } from '@/theme/tokens';
import type { LocalDate } from '@/utils/localDate';

type ProductDetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;

// Artboard geometry: a 360 hero with its buttons at y 52, and the sheet starting over it at y 328.
const heroHeight = 360;
const topRowTop = 52;
const sheetTop = 328;
// Scrolling slides the sheet up over the hero until it docks just below the back button.
const sheetDockTop = topRowTop + minTouchTarget + spacing.md;

export function ProductDetailsScreen({ navigation, route }: ProductDetailsScreenProps) {
  const { palette } = useDewyTheme();
  const product = useProduct(route.params.productId);
  const today = useLocalToday();

  if (product.data) {
    return <ProductDetailsContent product={product.data} today={today} navigation={navigation} />;
  }

  return (
    <Screen edges={['left', 'right']}>
      <View style={styles.plainTopRow}>
        <BackButton
          onPress={() => navigation.goBack()}
          backgroundColor={palette.surface}
          color={palette.text}
          boxShadow={palette.iconButtonShadow}
        />
      </View>
      <View style={styles.stateInset}>
        {product.data === null ? (
          <EmptyState
            title="This product is no longer on your shelf"
            message="It may have been deleted."
            action={{ label: 'Back', onPress: () => navigation.goBack() }}
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

type ProductDetailsContentProps = {
  product: Product;
  today: LocalDate;
  navigation: ProductDetailsScreenProps['navigation'];
};

function ProductDetailsContent({ product, today, navigation }: ProductDetailsContentProps) {
  const { palette } = useDewyTheme();
  const insets = useSafeAreaInsets();
  const [sheetOpen, setSheetOpen] = useState(false);
  const setFavorite = useSetFavorite();
  const moveToShelf = useMoveToShelf();
  const deleteProduct = useDeleteProduct();
  const colors = bottleColorsFor(product.id);
  const category = categoryDetails[product.category];
  const title = splitLastWord(product.name);
  const notes = noteLines(product.notes);
  const heroArt = (
    <>
      <View style={[styles.heroCircle, { backgroundColor: palette.peach }]} />
      <View style={styles.bottle}>
        <BottleIllustration
          shape={category.bottle}
          colors={colors}
          size="hero"
          monogram={productInitials(product.name)}
        />
        <Svg width={130} height={12} style={styles.ground}>
          <Ellipse cx={65} cy={6} rx={65} ry={6} fill={palette.tileGroundShadow} />
        </Svg>
      </View>
    </>
  );

  const deleting = deleteProduct.isPending || deleteProduct.isSuccess;

  function toggleFavorite() {
    if (setFavorite.isPending || deleting) {
      return;
    }
    setFavorite.mutate(
      { id: product.id, isFavorite: !product.isFavorite },
      {
        onError: () =>
          Alert.alert("Couldn't save your favourite", 'Check your connection and try again.'),
      },
    );
  }

  // Only old errors are cleared: resetting a running mutation would drop its result.
  function openSheet() {
    if (moveToShelf.isError) {
      moveToShelf.reset();
    }
    if (deleteProduct.isError) {
      deleteProduct.reset();
    }
    setSheetOpen(true);
  }

  function openEdit() {
    if (deleting) {
      return;
    }
    setSheetOpen(false);
    navigation.navigate('ProductForm', { productId: product.id });
  }

  // A failure reopens the sheet, so its error shows even if the sheet was closed while saving.
  function moveProductToShelf() {
    if (moveToShelf.isPending) {
      return;
    }
    if (deleteProduct.isError) {
      deleteProduct.reset();
    }
    moveToShelf.mutate(product.id, {
      onSuccess: () => setSheetOpen(false),
      onError: () => setSheetOpen(true),
    });
  }

  function deleteForGood() {
    if (deleting) {
      return;
    }
    if (moveToShelf.isError) {
      moveToShelf.reset();
    }
    deleteProduct.mutate(product.id, {
      onSuccess: () => {
        setSheetOpen(false);
        if (navigation.isFocused()) {
          navigation.goBack();
        }
      },
      onError: () => setSheetOpen(true),
    });
  }

  return (
    <Screen edges={['left', 'right']} statusBarStyle={colors.statusBar}>
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        pointerEvents="none"
        style={[styles.hero, { backgroundColor: colors.tile }]}
      >
        {product.photoPath ? (
          <ProductPhoto
            path={product.photoPath}
            style={StyleSheet.absoluteFill}
            placeholderColor={colors.tile}
            fallback={heroArt}
            overlay={<HeroPhotoScrim />}
          />
        ) : (
          heroArt
        )}
      </View>

      <View style={styles.sheetFrame}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSpacer} />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: palette.background,
                paddingBottom: spacing.screen + insets.bottom,
              },
            ]}
          >
            <View>
              <Text style={[styles.kicker, { color: palette.textMuted }]}>
                {product.brand ? `${category.label} · ${product.brand}` : category.label}
              </Text>
              <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>
                {title.head}
                <Text style={[styles.titleItalic, { color: palette.emphasis }]}>{title.last}</Text>
              </Text>
              <View style={styles.chips}>
                <View style={[styles.statusChip, { backgroundColor: palette.plum }]}>
                  <Text style={[styles.statusChipLabel, { color: palette.onPlum }]}>
                    {product.status === 'owned' ? 'Owned' : 'Wishlist'}
                  </Text>
                </View>
              </View>
            </View>

            <ShelfLifeCard
              product={product}
              today={today}
              onAddOpenedDate={
                product.status === 'owned' && !product.openedOn && !deleting ? openEdit : undefined
              }
            />

            {product.ingredients.length > 0 ? (
              <View>
                <Text
                  accessibilityRole="header"
                  style={[styles.sectionLabel, { color: palette.textMuted }]}
                >
                  Key ingredients
                </Text>
                <IngredientChips ingredients={product.ingredients} />
              </View>
            ) : null}

            {notes.length > 0 ? (
              <View
                style={[
                  styles.notes,
                  { backgroundColor: palette.surface, boxShadow: palette.cardShadow },
                ]}
              >
                {notes.map((line, index) => (
                  <View
                    key={index}
                    style={[
                      styles.noteRow,
                      index < notes.length - 1 && [
                        styles.noteDivider,
                        { borderBottomColor: palette.divider },
                      ],
                    ]}
                  >
                    <View
                      importantForAccessibility="no-hide-descendants"
                      accessibilityElementsHidden
                      style={[styles.noteIcon, { backgroundColor: palette.lilac }]}
                    >
                      <CheckIcon color={palette.plum} />
                    </View>
                    <Text style={[styles.noteText, { color: palette.text }]}>{line}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>

      <View style={styles.topRow}>
        <BackButton
          onPress={() => navigation.goBack()}
          backgroundColor={palette.heroButton}
          color={palette.onAccent}
        />
        <View style={styles.topActions}>
          <HeroButton label="Favourite" selected={product.isFavorite} onPress={toggleFavorite}>
            <HeartIcon color={palette.berry} filled={product.isFavorite} />
          </HeroButton>
          <HeroButton label="More options" onPress={openSheet}>
            <MoreIcon color={palette.onAccent} />
          </HeroButton>
        </View>
      </View>

      {sheetOpen ? (
        <ProductActionsSheet
          product={product}
          moving={moveToShelf.isPending}
          deleting={deleting}
          moveFailed={moveToShelf.isError}
          deleteFailed={deleteProduct.isError}
          onClose={() => setSheetOpen(false)}
          onEdit={openEdit}
          onMoveToShelf={moveProductToShelf}
          onDelete={deleteForGood}
        />
      ) : null}
    </Screen>
  );
}

type HeroButtonProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  children: ReactNode;
};

function HeroButton({ label, selected, onPress, children }: HeroButtonProps) {
  const { palette } = useDewyTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.roundButton,
        { backgroundColor: palette.heroButton, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      {children}
    </Pressable>
  );
}

// A photo can be any colour, so the status bar turns light over a soft dark fade while it shows.
function HeroPhotoScrim() {
  return (
    <>
      <StatusBar style="light" />
      <Svg width="100%" height={140} style={styles.scrim}>
        <Defs>
          <LinearGradient id="heroScrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={photoScrim} stopOpacity={0.45} />
            <Stop offset="1" stopColor={photoScrim} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#heroScrim)" />
      </Svg>
    </>
  );
}

function HeartIcon({ color, filled }: { color: string; filled: boolean }) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={1.9}
      strokeLinejoin="round"
    >
      <Path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </Svg>
  );
}

function MoreIcon({ color }: { color: string }) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
    >
      <Path d="M5 12h.01M12 12h.01M19 12h.01" />
    </Svg>
  );
}

type BackButtonProps = {
  onPress: () => void;
  backgroundColor: string;
  color: string;
  boxShadow?: string;
};

function BackButton({ onPress, backgroundColor, color, boxShadow }: BackButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={onPress}
      style={({ pressed }) => [
        styles.roundButton,
        { backgroundColor, boxShadow, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Feather name="chevron-left" size={20} color={color} />
    </Pressable>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M5 12.5l4.5 4.5L19 7.5" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  plainTopRow: {
    marginTop: topRowTop,
    paddingHorizontal: spacing.xxl,
  },
  stateInset: {
    paddingHorizontal: spacing.screen,
  },
  hero: {
    height: heroHeight,
    overflow: 'hidden',
  },
  heroCircle: {
    position: 'absolute',
    top: 70,
    left: '50%',
    width: 240,
    height: 240,
    marginLeft: -120,
    borderRadius: 120,
    opacity: 0.55,
  },
  bottle: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 48,
    alignItems: 'center',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  ground: {
    marginTop: spacing.snug,
  },
  topRow: {
    position: 'absolute',
    top: topRowTop,
    left: spacing.xxl,
    right: spacing.xxl,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roundButton: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  // Its rounded top keeps the docked sheet's corners while the content scrolls underneath.
  sheetFrame: {
    position: 'absolute',
    top: sheetDockTop,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSpacer: {
    height: sheetTop - sheetDockTop,
  },
  sheet: {
    flexGrow: 1,
    gap: spacing.xl,
    paddingTop: 28,
    paddingHorizontal: spacing.screen,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
  },
  kicker: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.kicker,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  title: {
    overflow: 'visible',
    marginTop: spacing.snug,
    fontFamily: fonts.display,
    fontSize: fontSizes.formTitle,
    lineHeight: fontSizes.formTitle * 1.1,
    letterSpacing: letterSpacings.title,
  },
  titleItalic: {
    fontFamily: fonts.displayItalic,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  statusChip: {
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
  },
  statusChipLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.meta,
  },
  sectionLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.meta,
    letterSpacing: letterSpacings.section,
    textTransform: 'uppercase',
  },
  notes: {
    paddingVertical: spacing.snug,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.detailCard,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  noteDivider: {
    borderBottomWidth: 1,
  },
  noteIcon: {
    width: 32,
    height: 32,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  noteText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSizes.secondary,
    lineHeight: 18.9,
  },
});
