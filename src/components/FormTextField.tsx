import { useImperativeHandle, useRef, useState, type Ref } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputInstance,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import type { TextFieldHandle } from '@/components/TextField';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type FormTextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  style?: StyleProp<ViewStyle>;
  ref?: Ref<TextFieldHandle>;
};

// The forms' external-label field: a sentence-case label above a 50-high box (taller when multiline).
export function FormTextField({
  label,
  error,
  style,
  ref,
  multiline,
  onFocus,
  onBlur,
  ...inputProps
}: FormTextFieldProps) {
  const { palette } = useDewyTheme();
  const inputRef = useRef<TextInputInstance>(null);
  const [focused, setFocused] = useState(false);

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }), []);

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      <Pressable
        accessible={false}
        focusable={false}
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.box,
          multiline ? styles.boxMultiline : styles.boxSingleLine,
          {
            backgroundColor: palette.surface,
            borderColor: error ? palette.warning : palette.mauve,
            boxShadow: focused ? palette.focusRing : undefined,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          accessibilityLabel={label}
          placeholderTextColor={palette.placeholder}
          selectionColor={palette.rose}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[styles.input, multiline && styles.inputMultiline, { color: palette.text }]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...inputProps}
        />
      </Pressable>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={[styles.error, { color: palette.warning }]}>
          {error}
        </Text>
      ) : null}
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
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderRadius: radii.input,
  },
  boxSingleLine: {
    height: 50,
    justifyContent: 'center',
  },
  boxMultiline: {
    paddingVertical: spacing.lg,
  },
  input: {
    padding: 0,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.body,
  },
  // Three lines tall, so a tap anywhere in the empty box lands on the input.
  inputMultiline: {
    minHeight: 66,
  },
  error: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.meta,
  },
});
