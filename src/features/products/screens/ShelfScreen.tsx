import { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { CategoryChips, type CategoryFilter } from '@/features/products/components/CategoryChips';
import { ProductCard } from '@/features/products/components/ProductCard';
import { useProducts } from '@/features/products/hooks/useProducts';
import type { ProductStatus } from '@/features/products/types';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, letterSpacings, spacing } from '@/theme/tokens';

const gridGap = spacing.lg;

function countLabel(count: number) {
  return `${count} ${count === 1 ? 'product' : 'products'}`;
}

export function ShelfScreen() {
  const { palette } = useDewyTheme();
  const { width } = useWindowDimensions();
  const products = useProducts();
  const [status, setStatus] = useState<ProductStatus>('owned');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const ownedCount = products.data?.filter((product) => product.status === 'owned').length ?? 0;
  const wishlistCount = (products.data?.length ?? 0) - ownedCount;
  const visible = (products.data ?? []).filter(
    (product) => product.status === status && (category === 'all' || product.category === category),
  );
  const cardWidth = (width - spacing.screen * 2 - gridGap) / 2;

  function handleStatusChange(next: ProductStatus) {
    if (next === status) {
      return;
    }
    setStatus(next);
    setCategory('all');
  }

  // Local state, so the spinner only shows for a pull and not for background refetches.
  async function handleRefresh() {
    setRefreshing(true);
    await products.refetch();
    setRefreshing(false);
  }

  // The chip row runs edge to edge, so only the other parts carry the screen inset.
  const header = (
    <View style={visible.length > 0 && styles.headerAboveGrid}>
      <View style={styles.inset}>
        <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>
          Your <Text style={[styles.titleItalic, { color: palette.emphasis }]}>shelf</Text>
        </Text>
        {products.data ? (
          <>
            <Text style={[styles.summary, { color: palette.textMuted }]}>
              {status === 'owned'
                ? countLabel(ownedCount)
                : `${countLabel(wishlistCount)} you have your eye on`}
            </Text>
            <View style={styles.segmented}>
              <SegmentedControl
                options={[
                  { value: 'owned', label: 'Owned', count: ownedCount },
                  { value: 'wishlist', label: 'Wishlist', count: wishlistCount },
                ]}
                value={status}
                onChange={handleStatusChange}
              />
            </View>
          </>
        ) : null}
      </View>
      {products.data ? (
        <View style={styles.chips}>
          <CategoryChips key={status} value={category} onChange={setCategory} />
        </View>
      ) : null}
    </View>
  );

  return (
    <Screen edges={['left', 'right']}>
      <FlatList
        data={visible}
        keyExtractor={(product) => product.id}
        numColumns={2}
        renderItem={({ item }) => <ProductCard product={item} width={cardWidth} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={styles.inset}>
            {products.data ? (
              <EmptyState
                title="Nothing here yet"
                message="Add a product and it will show up on this shelf."
              />
            ) : products.isError ? (
              <ErrorState
                message="We couldn't load your shelf. Check your connection and try again."
                onRetry={() => products.refetch()}
                retrying={products.isFetching}
              />
            ) : (
              <LoadingState />
            )}
          </View>
        }
        ItemSeparatorComponent={RowGap}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing && products.data !== undefined}
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

function RowGap() {
  return <View style={styles.rowGap} />;
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingTop: 56,
    paddingBottom: spacing.screen,
  },
  inset: {
    paddingHorizontal: spacing.screen,
  },
  headerAboveGrid: {
    marginBottom: 18,
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
  summary: {
    marginTop: spacing.xxs,
    fontFamily: fonts.body,
    fontSize: fontSizes.secondary,
  },
  segmented: {
    marginTop: 18,
  },
  chips: {
    marginTop: spacing.lg,
  },
  row: {
    gap: gridGap,
    paddingHorizontal: spacing.screen,
  },
  rowGap: {
    height: gridGap,
  },
});
