import { useImperativeHandle, useRef, useState, type Ref } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputInstance,
  type ViewStyle,
} from 'react-native';

import type { TextFieldHandle } from '@/components/TextField';
import { useDewyTheme } from '@/theme/ThemeProvider';
import {
  fixedWidthMaxFontScale,
  fonts,
  fontSizes,
  minTouchTarget,
  radii,
  spacing,
} from '@/theme/tokens';

type SizeFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  onBlur: () => void;
  onFocus: () => void;
  onSubmitEditing: () => void;
  invalid: boolean;
  style?: StyleProp<ViewStyle>;
  ref?: Ref<TextFieldHandle>;
};

// The bottle size in ml: a compact box with an "ml" suffix, sized to sit beside How full.
export function SizeField({
  value,
  onChangeText,
  onBlur,
  onFocus,
  onSubmitEditing,
  invalid,
  style,
  ref,
}: SizeFieldProps) {
  const { palette } = useDewyTheme();
  const inputRef = useRef<TextInputInstance>(null);
  const [focused, setFocused] = useState(false);

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }), []);

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.label, { color: palette.text }]}>Size</Text>
      <Pressable
        accessible={false}
        focusable={false}
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.box,
          {
            backgroundColor: palette.surface,
            borderColor: invalid ? palette.warning : palette.mauve,
            boxShadow: focused ? palette.focusRing : undefined,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          accessibilityLabel="Size in ml"
          keyboardType="number-pad"
          returnKeyType="next"
          submitBehavior="submit"
          placeholder="50"
          placeholderTextColor={palette.placeholder}
          selectionColor={palette.rose}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => {
            setFocused(true);
            onFocus();
          }}
          onBlur={() => {
            setFocused(false);
            onBlur();
          }}
          onSubmitEditing={onSubmitEditing}
          maxFontSizeMultiplier={fixedWidthMaxFontScale}
          style={[styles.input, { color: palette.text }]}
        />
        <Text
          maxFontSizeMultiplier={fixedWidthMaxFontScale}
          style={[styles.suffix, { color: palette.textMuted }]}
        >
          ml
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.snug,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.meta,
  },
  box: {
    height: minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.snug,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radii.tile,
  },
  input: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.secondary,
  },
  suffix: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.secondary,
  },
});
