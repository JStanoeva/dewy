import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
  type BarcodeSettings,
} from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { CloseIcon } from '@/features/products/components/CloseIcon';
import { barcodePattern } from '@/features/products/constants';
import type { RootStackParamList } from '@/navigation/types';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, minTouchTarget, radii, spacing } from '@/theme/tokens';

type BarcodeScannerScreenProps = NativeStackScreenProps<RootStackParamList, 'BarcodeScanner'>;

// Android reads the list only when the camera starts, so it stays one constant.
const barcodeSettings: BarcodeSettings = { barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] };

const frameWidth = 280;
const frameHeight = 180;
const frameRadius = radii.productCard;
// The same spot as the form's close button, which the scanner returns to.
const closeTop = 48;

type Size = { width: number; height: number };

export function BarcodeScannerScreen({ navigation }: BarcodeScannerScreenProps) {
  const { palette } = useDewyTheme();
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [cameraFailed, setCameraFailed] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const [size, setSize] = useState<Size | null>(null);
  // Shows the spinner while a tapped request waits; Expo Go's own dialog never answers if dismissed with Back.
  const [asking, setAsking] = useState(false);
  // Blocks a second tap that arrives before the spinner has replaced the button.
  const askingRef = useRef(false);
  // Set once the screen starts leaving, so a frame decoded during the close animation is ignored.
  const leavingRef = useRef(false);
  const askedRef = useRef(false);

  useEffect(
    () =>
      navigation.addListener('beforeRemove', () => {
        leavingRef.current = true;
      }),
    [navigation],
  );

  // The hook reads the permission only on mount, so read it again after Settings or a system dialog.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        getPermission().catch(() => undefined);
      }
    });
    return () => subscription.remove();
  }, [getPermission]);

  // Tapping the scan card already says the camera is wanted, so ask straight away the first time.
  useEffect(() => {
    if (permission?.status === 'undetermined' && !askedRef.current) {
      askedRef.current = true;
      requestPermission().catch(() => undefined);
    }
  }, [permission, requestPermission]);

  function onBarcodeScanned({ data }: BarcodeScanningResult) {
    if (leavingRef.current || !barcodePattern.test(data)) {
      return;
    }
    leavingRef.current = true;
    // Synchronous on purpose: a late popTo would replace whatever screen is on top by then.
    navigation.popTo('ProductForm', { barcode: data }, { merge: true });
  }

  // After a scan has already returned to the form, a queued tap here would close the form too.
  function close() {
    if (navigation.isFocused()) {
      navigation.goBack();
    }
  }

  async function askAgain() {
    if (askingRef.current) {
      return;
    }
    askingRef.current = true;
    setAsking(true);
    try {
      await requestPermission();
    } catch {
      // Nothing to undo: the screen keeps offering the same choices.
    } finally {
      askingRef.current = false;
      setAsking(false);
    }
  }

  // Asks first: Expo's "blocked" flag can be stale, and the dialog is better than a trip to Settings.
  async function openSettings() {
    if (askingRef.current) {
      return;
    }
    askingRef.current = true;
    setAsking(true);
    try {
      const result = await requestPermission();
      if (!result.granted && !result.canAskAgain) {
        await Linking.openSettings();
      }
    } catch {
      // Nothing to undo: the screen keeps offering the same choices.
    } finally {
      askingRef.current = false;
      setAsking(false);
    }
  }

  function retryCamera() {
    setCameraFailed(false);
    setCameraKey((key) => key + 1);
  }

  if (permission?.granted && !cameraFailed) {
    const frameX = size ? (size.width - frameWidth) / 2 : 0;
    const frameY = size ? (size.height - frameHeight) / 2 : 0;

    return (
      <Screen edges={[]} statusBarStyle="light">
        <View
          style={styles.fill}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setSize({ width, height });
          }}
        >
          <CameraView
            key={cameraKey}
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={barcodeSettings}
            onBarcodeScanned={onBarcodeScanned}
            onMountError={() => setCameraFailed(true)}
          />
          {size ? (
            <>
              <View
                pointerEvents="none"
                importantForAccessibility="no-hide-descendants"
                style={StyleSheet.absoluteFill}
              >
                <Svg width={size.width} height={size.height}>
                  <Path
                    d={scrimPath(size, frameX, frameY)}
                    fill={palette.cameraScrim}
                    fillRule="evenodd"
                  />
                  <Rect
                    x={frameX}
                    y={frameY}
                    width={frameWidth}
                    height={frameHeight}
                    rx={frameRadius}
                    fill="none"
                    stroke={palette.peach}
                    strokeWidth={3}
                  />
                </Svg>
              </View>
              <Text
                style={[
                  styles.hint,
                  { top: frameY + frameHeight + spacing.xxl, color: palette.cream },
                ]}
              >
                Point at the barcode
              </Text>
            </>
          ) : null}
          <CloseButton onPress={close} overCamera />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right']}>
      <CloseButton onPress={close} />
      <View style={styles.inset}>
        {cameraFailed ? (
          <EmptyState
            title="The camera didn't start"
            message="Close other camera apps and try again, or add the details yourself."
            action={{ label: 'Try again', onPress: retryCamera }}
          />
        ) : asking || !permission || permission.status === 'undetermined' ? (
          <LoadingState />
        ) : permission.canAskAgain ? (
          <EmptyState
            title="Scanning needs your camera"
            message="Allow it so Dewy can read the barcode."
            action={{ label: 'Allow camera', onPress: askAgain }}
          />
        ) : (
          <EmptyState
            title="Camera access is off"
            message="Turn it on in your phone's settings, or add the details yourself."
            action={{ label: 'Open settings', onPress: openSettings }}
          />
        )}
        <Pressable accessibilityRole="button" onPress={close} style={styles.manual}>
          <Text style={[styles.manualLabel, { color: palette.emphasis }]}>
            Enter details manually
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function CloseButton({
  onPress,
  overCamera = false,
}: {
  onPress: () => void;
  overCamera?: boolean;
}) {
  const { palette } = useDewyTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Close"
      onPress={onPress}
      style={({ pressed }) => [
        styles.close,
        overCamera
          ? { backgroundColor: palette.heroButton }
          : { backgroundColor: palette.surface, boxShadow: palette.iconButtonShadow },
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <CloseIcon color={overCamera ? palette.onAccent : palette.text} />
    </Pressable>
  );
}

// The whole screen minus a rounded window; evenodd leaves the window clear.
function scrimPath({ width, height }: Size, x: number, y: number) {
  const r = frameRadius;
  const right = x + frameWidth;
  const bottom = y + frameHeight;
  return [
    `M0 0H${width}V${height}H0Z`,
    `M${x + r} ${y}H${right - r}A${r} ${r} 0 0 1 ${right} ${y + r}V${bottom - r}`,
    `A${r} ${r} 0 0 1 ${right - r} ${bottom}H${x + r}A${r} ${r} 0 0 1 ${x} ${bottom - r}`,
    `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`,
  ].join(' ');
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  hint: {
    position: 'absolute',
    left: spacing.screen,
    right: spacing.screen,
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.body,
    textAlign: 'center',
  },
  close: {
    position: 'absolute',
    top: closeTop,
    left: spacing.xxl,
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  // Clears the close button, matching where the form's content starts.
  inset: {
    marginTop: closeTop + minTouchTarget,
    paddingHorizontal: spacing.screen,
  },
  manual: {
    alignSelf: 'center',
    justifyContent: 'center',
    minHeight: minTouchTarget,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xxs,
  },
  manualLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.secondary,
  },
});
