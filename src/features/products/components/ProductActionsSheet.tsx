import Feather from '@expo/vector-icons/Feather';
import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Product } from '@/features/products/types';
import { BottleIcon } from '@/navigation/TabIcons';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, letterSpacings, radii, spacing } from '@/theme/tokens';

type ProductActionsSheetProps = {
  product: Product;
  moving: boolean;
  deleting: boolean;
  moveFailed: boolean;
  deleteFailed: boolean;
  onClose: () => void;
  onEdit: () => void;
  onMoveToShelf: () => void;
  onDelete: () => void;
};

const moveError = "We couldn't move this product. Check your connection and try again.";
const deleteError = "We couldn't delete this product. Check your connection and try again.";

// Mounted only while open, so the delete confirmation always starts from the menu.
export function ProductActionsSheet({
  product,
  moving,
  deleting,
  moveFailed,
  deleteFailed,
  onClose,
  onEdit,
  onMoveToShelf,
  onDelete,
}: ProductActionsSheetProps) {
  const { palette } = useDewyTheme();
  const insets = useSafeAreaInsets();
  const [confirming, setConfirming] = useState(false);
  const confirmTitleRef = useRef<ComponentRef<typeof Text>>(null);
  const busy = moving || deleting;

  useEffect(() => {
    if (confirming && confirmTitleRef.current) {
      AccessibilityInfo.sendAccessibilityEvent(confirmTitleRef.current, 'focus');
    }
  }, [confirming]);

  function errorLine(message: string, style: StyleProp<TextStyle>) {
    return (
      <Text
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[styles.error, style, { color: palette.warning }]}
      >
        {message}
      </Text>
    );
  }

  const cancelButton = (
    <Pressable
      accessibilityRole="button"
      onPress={onClose}
      style={({ pressed }) => [
        styles.pillButton,
        { backgroundColor: palette.background, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={[styles.cancelLabel, { color: palette.text }]}>Cancel</Text>
    </Pressable>
  );

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: palette.scrim }]}
        />
        <View
          style={[
            styles.sheet,
            { backgroundColor: palette.surface, paddingBottom: spacing.screen + insets.bottom },
          ]}
        >
          {confirming ? (
            <>
              <Text
                ref={confirmTitleRef}
                accessibilityRole="header"
                style={[styles.confirmTitle, { color: palette.text }]}
              >
                Delete this{' '}
                <Text style={[styles.confirmTitleItalic, { color: palette.emphasis }]}>
                  product?
                </Text>
              </Text>
              <Text style={[styles.confirmMessage, { color: palette.textMuted }]}>
                <Text style={[styles.confirmName, { color: palette.text }]}>{product.name}</Text>{' '}
                will be removed from your {product.status === 'owned' ? 'shelf' : 'wishlist'}. This
                can&apos;t be undone.
              </Text>
              {deleteFailed ? errorLine(deleteError, styles.confirmError) : null}
              <View style={styles.confirmButtons}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete product"
                  accessibilityState={{ disabled: deleting, busy: deleting }}
                  disabled={deleting}
                  onPress={onDelete}
                  style={({ pressed }) => [
                    styles.pillButton,
                    { backgroundColor: palette.warning, opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  {deleting ? (
                    <ActivityIndicator color={palette.onPrimary} />
                  ) : (
                    <Text style={[styles.deleteLabel, { color: palette.onPrimary }]}>
                      Delete product
                    </Text>
                  )}
                </Pressable>
                {cancelButton}
              </View>
            </>
          ) : (
            <>
              <SheetRow
                label="Edit product"
                circleColor={palette.peach}
                icon={<Feather name="edit-2" size={18} color={palette.onAccent} />}
                disabled={busy}
                onPress={onEdit}
              />
              {product.status === 'wishlist' || moving ? (
                <SheetRow
                  label="Move to shelf"
                  subline="Moves it to Owned, unopened"
                  circleColor={palette.lilac}
                  icon={<BottleIcon color={palette.onAccent} size={18} />}
                  busy={moving}
                  disabled={busy}
                  onPress={onMoveToShelf}
                />
              ) : null}
              <SheetRow
                label="Delete product"
                labelColor={palette.warning}
                circleColor={palette.warningSoft}
                icon={<Feather name="trash-2" size={18} color={palette.berry} />}
                busy={deleting}
                disabled={busy}
                onPress={() => setConfirming(true)}
                last
              />
              {moveFailed
                ? errorLine(moveError, styles.menuError)
                : deleteFailed
                  ? errorLine(deleteError, styles.menuError)
                  : null}
              <View style={styles.menuCancel}>{cancelButton}</View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

type SheetRowProps = {
  label: string;
  subline?: string;
  labelColor?: string;
  circleColor: string;
  icon: ReactNode;
  busy?: boolean;
  disabled: boolean;
  onPress: () => void;
  last?: boolean;
};

function SheetRow({
  label,
  subline,
  labelColor,
  circleColor,
  icon,
  busy = false,
  disabled,
  onPress,
  last = false,
}: SheetRowProps) {
  const { palette } = useDewyTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subline ? `${label}. ${subline}` : label}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && [styles.rowDivider, { borderBottomColor: palette.divider }],
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={[styles.rowIcon, { backgroundColor: circleColor }]}
      >
        {busy ? <ActivityIndicator size="small" color={palette.onAccent} /> : icon}
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: labelColor ?? palette.text }]}>{label}</Text>
        {subline ? (
          <Text style={[styles.rowSubline, { color: palette.textMuted }]}>{subline}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingTop: spacing.screen,
    paddingHorizontal: spacing.screen,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingVertical: spacing.xs,
  },
  rowDivider: {
    borderBottomWidth: 1,
  },
  rowIcon: {
    width: 34,
    height: 34,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  rowText: {
    flex: 1,
    gap: 1,
  },
  rowLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.body,
  },
  rowSubline: {
    fontFamily: fonts.body,
    fontSize: fontSizes.meta,
  },
  error: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.meta,
  },
  menuError: {
    marginTop: spacing.xs,
  },
  confirmError: {
    marginTop: spacing.md,
  },
  menuCancel: {
    marginTop: spacing.md,
  },
  pillButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screen,
    borderRadius: radii.pill,
  },
  cancelLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.body,
  },
  deleteLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.body,
  },
  confirmTitle: {
    overflow: 'visible',
    fontFamily: fonts.display,
    fontSize: fontSizes.section,
    lineHeight: fontSizes.section * 1.15,
    letterSpacing: letterSpacings.title,
  },
  confirmTitleItalic: {
    fontFamily: fonts.displayItalic,
  },
  confirmMessage: {
    marginTop: spacing.xs,
    fontFamily: fonts.body,
    fontSize: fontSizes.secondary,
    lineHeight: 18.9,
  },
  confirmName: {
    fontFamily: fonts.bodyBold,
  },
  confirmButtons: {
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
});
