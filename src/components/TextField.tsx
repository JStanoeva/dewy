import { useImperativeHandle, useRef, useState, type ReactNode, type Ref } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
} from 'react-native';

import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, letterSpacings, radii, spacing } from '@/theme/tokens';

export type TextFieldHandle = {
  focus: () => void;
};

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  trailing?: ReactNode;
  ref?: Ref<TextFieldHandle>;
};

export function TextField({
  label,
  error,
  trailing,
  ref,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const { palette } = useDewyTheme();
  const inputRef = useRef<TextInputInstance>(null);
  const [focused, setFocused] = useState(false);

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }), []);

  return (
    <View style={styles.container}>
      <Pressable
        accessible={false}
        focusable={false}
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.box,
          {
            paddingRight: trailing ? spacing.snug : spacing.xl,
            backgroundColor: palette.surface,
            borderColor: error ? palette.warning : palette.mauve,
            boxShadow: focused ? palette.focusRing : undefined,
          },
        ]}
      >
        <View style={styles.column}>
          <Text style={[styles.label, { color: palette.textMuted }]}>{label}</Text>
          <TextInput
            ref={inputRef}
            accessibilityLabel={label}
            placeholderTextColor={palette.placeholder}
            selectionColor={palette.rose}
            style={[styles.input, { color: palette.text }]}
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
        </View>
        {trailing}
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
  box: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.xl,
    borderWidth: 1,
    borderRadius: radii.input,
  },
  column: {
    flex: 1,
    gap: spacing.hairline,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.label,
    letterSpacing: letterSpacings.label,
    textTransform: 'uppercase',
  },
  input: {
    padding: 0,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.body,
  },
  error: {
    paddingHorizontal: spacing.xl,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.meta,
  },
});
