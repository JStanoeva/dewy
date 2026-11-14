import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProductPhoto } from '@/features/products/components/ProductPhoto';
import {
  CameraPermissionError,
  pickProductPhoto,
  type PhotoSource,
} from '@/features/products/services/productPhotoService';
import type { ProductPhotoValue } from '@/features/products/types';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, minTouchTarget, radii, spacing } from '@/theme/tokens';

// 'idle' keeps the line's height once a read is over, so the fields below don't jump.
export type LabelStatus = 'reading' | 'filled' | 'unread' | 'idle';

const labelMessages: Record<LabelStatus, string> = {
  reading: 'Reading the label…',
  filled: 'Filled in from the label. Check it before saving.',
  unread: "Couldn't read the label. Add the details yourself.",
  idle: '',
};

type ProductPhotoFieldProps = {
  value: ProductPhotoValue | null;
  onChange: (value: ProductPhotoValue | null) => void;
  disabled: boolean;
  labelStatus?: LabelStatus;
};

// 18 tall plus 12 above and 14 below makes a 44 target that stays inside the gaps around it.
const removeSlop = { top: spacing.md, bottom: spacing.lg, left: spacing.lg, right: spacing.lg };

export function ProductPhotoField({
  value,
  onChange,
  disabled,
  labelStatus,
}: ProductPhotoFieldProps) {
  const { palette } = useDewyTheme();
  const [picking, setPicking] = useState(false);
  const busy = disabled || picking;

  async function pick(source: PhotoSource) {
    if (busy) {
      return;
    }
    setPicking(true);
    try {
      const photo = await pickProductPhoto(source);
      if (photo) {
        onChange({ kind: 'new', uri: photo.uri });
      }
    } catch (error) {
      if (error instanceof CameraPermissionError) {
        Alert.alert('Camera access is off', 'Turn it on in Settings to take product photos.', [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open settings', onPress: () => Linking.openSettings() },
        ]);
      } else {
        Alert.alert("Couldn't use that photo", 'Try again or pick another one.');
      }
    } finally {
      setPicking(false);
    }
  }

  const emptyFrame = (
    <View style={[styles.frame, styles.emptyFrame, { borderColor: palette.mauve }]}>
      <Feather name="camera" size={22} color={palette.textMuted} />
    </View>
  );

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: palette.text }]}>Photo</Text>
      <View style={styles.row}>
        <View
          accessible={value !== null}
          accessibilityRole={value ? 'image' : undefined}
          accessibilityLabel={value ? 'Product photo' : undefined}
        >
          {picking ? (
            <View style={[styles.frame, styles.emptyFrame, { borderColor: palette.mauve }]}>
              <ActivityIndicator color={palette.textMuted} />
            </View>
          ) : value?.kind === 'new' ? (
            <Image
              source={{ uri: value.uri }}
              contentFit="cover"
              style={[styles.frame, { backgroundColor: palette.surface }]}
            />
          ) : value?.kind === 'stored' ? (
            <ProductPhoto
              path={value.path}
              style={styles.frame}
              placeholderColor={palette.surface}
              fallback={emptyFrame}
            />
          ) : (
            emptyFrame
          )}
        </View>

        <View style={styles.actions}>
          <PhotoButton
            icon="camera"
            title="Take photo"
            disabled={busy}
            onPress={() => pick('camera')}
          />
          <PhotoButton
            icon="image"
            title="Choose photo"
            disabled={busy}
            onPress={() => pick('library')}
          />
          {value ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              hitSlop={removeSlop}
              onPress={() => onChange(null)}
              style={styles.remove}
            >
              <Text style={[styles.label, { color: palette.emphasis }]}>Remove photo</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {labelStatus ? (
        <View style={styles.labelStatus}>
          {labelStatus === 'reading' ? (
            <ActivityIndicator
              size="small"
              color={palette.textMuted}
              importantForAccessibility="no"
            />
          ) : null}
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.label, styles.labelStatusText, { color: palette.textMuted }]}
          >
            {labelMessages[labelStatus]}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

type PhotoButtonProps = {
  icon: 'camera' | 'image';
  title: string;
  disabled: boolean;
  onPress: () => void;
};

function PhotoButton({ icon, title, disabled, onPress }: PhotoButtonProps) {
  const { palette } = useDewyTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.surface, opacity: disabled ? 0.6 : pressed ? 0.7 : 1 },
      ]}
    >
      <Feather name={icon} size={16} color={palette.text} />
      <Text style={[styles.buttonLabel, { color: palette.text }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.meta,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  // Square, like the crop, and as tall as the two buttons beside it.
  frame: {
    width: 96,
    height: 96,
    borderRadius: radii.input,
  },
  emptyFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  actions: {
    flex: 1,
    gap: spacing.xs,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radii.tile,
  },
  buttonLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.secondary,
  },
  remove: {
    alignSelf: 'flex-start',
    minHeight: 18,
    justifyContent: 'center',
    marginTop: spacing.xxs,
  },
  // As tall as Android's small spinner, so the line keeps its height when the spinner goes.
  labelStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 20,
  },
  labelStatusText: {
    flexShrink: 1,
  },
});
