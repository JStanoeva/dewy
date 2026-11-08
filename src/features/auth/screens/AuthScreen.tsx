import Feather from '@expo/vector-icons/Feather';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { TextField } from '@/components/TextField';
import { logInSchema, signUpSchema, type AuthFormValues } from '@/features/auth/schemas/authSchema';
import { getAuthErrorFeedback, signIn, signUp } from '@/features/auth/services/authService';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, letterSpacings, minTouchTarget, radii, spacing } from '@/theme/tokens';

type AuthMode = 'signup' | 'login';

const modeOptions = [
  { value: 'signup', label: 'Sign up' },
  { value: 'login', label: 'Log in' },
] as const;

// Space kept under the focused text line: the rest of its box, a two-line error, and a little air.
const FIELD_REVEAL_OFFSET = 64;

export function AuthScreen() {
  const { palette } = useDewyTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [mode, setMode] = useState<AuthMode>('signup');
  const [showPassword, setShowPassword] = useState(false);
  const isSignUp = mode === 'signup';

  // Android's own scroll-to-input is unreliable (text line only, or nothing on smaller phones), so do it here.
  function revealFocusedField() {
    const input = TextInput.State.currentlyFocusedInput();
    if (input && Keyboard.isVisible()) {
      scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(
        input,
        FIELD_REVEAL_OFFSET,
        true,
      );
    }
  }

  function handleKeyboardResize() {
    revealFocusedField();
    // A second pass lands after Android's own smooth scroll, which can finish last when animations are shortened.
    setTimeout(revealFocusedField, 300);
  }

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(isSignUp ? signUpSchema : logInSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  function changeMode(nextMode: AuthMode) {
    if (isSubmitting) {
      return;
    }
    clearErrors();
    setMode(nextMode);
  }

  async function onSubmit(values: AuthFormValues) {
    try {
      if (isSignUp) {
        await signUp(values);
        Alert.alert('Welcome to Dewy', 'Your account is ready.');
      } else {
        await signIn(values);
        Alert.alert('Welcome back', "You're logged in.");
      }
    } catch (error) {
      const { field, message } = getAuthErrorFeedback(error);
      setError(field === 'root' ? 'root.server' : field, { message });
    }
  }

  function submit() {
    if (!isSubmitting) {
      handleSubmit(onSubmit)();
    }
  }

  return (
    <Screen edges={['left', 'right']}>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView
          ref={scrollRef}
          onLayout={handleKeyboardResize}
          onContentSizeChange={revealFocusedField}
          contentContainerStyle={[styles.scrollContent, { backgroundColor: palette.peach }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={[styles.orbitLine, { borderColor: palette.orbitLine }]} />
            <View style={[styles.orbitDashed, { borderColor: palette.orbitDashed }]} />
            <View style={[styles.orbitCore, { backgroundColor: palette.salmon }]} />
            <View style={[styles.orbitDot, { backgroundColor: palette.plum }]} />
            <View
              style={[
                styles.orbitRing,
                { borderColor: palette.plum, backgroundColor: palette.peach },
              ]}
            />
            <View style={styles.header}>
              <Text style={[styles.wordmark, { color: palette.text }]}>Dewy</Text>
              <Text style={[styles.tagline, { color: palette.textSoft }]}>
                Your skincare ritual, beautifully kept.
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.sheet,
              {
                backgroundColor: palette.background,
                paddingBottom: insets.bottom + spacing.screen,
              },
            ]}
          >
            <Text accessibilityRole="header" style={[styles.heading, { color: palette.text }]}>
              {isSignUp ? 'Begin your ritual' : 'Welcome back'}
            </Text>

            <SegmentedControl options={modeOptions} value={mode} onChange={changeMode} />

            <View style={styles.fields}>
              {isSignUp ? (
                <Controller
                  control={control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <TextField
                      ref={field.ref}
                      label="Your name"
                      placeholder="What should we call you?"
                      autoCapitalize="words"
                      autoComplete="given-name"
                      returnKeyType="next"
                      submitBehavior="submit"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      onFocus={revealFocusedField}
                      onSubmitEditing={() => setFocus('email')}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              ) : null}

              <Controller
                control={control}
                name="email"
                render={({ field, fieldState }) => (
                  <TextField
                    ref={field.ref}
                    label="Email"
                    placeholder="you@example.com"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="next"
                    submitBehavior="submit"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    onFocus={revealFocusedField}
                    onSubmitEditing={() => setFocus('password')}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field, fieldState }) => (
                  <TextField
                    ref={field.ref}
                    label="Password"
                    placeholder={isSignUp ? 'At least 8 characters' : 'Your password'}
                    autoCapitalize="none"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    autoCorrect={false}
                    secureTextEntry={!showPassword}
                    keyboardType={showPassword ? 'visible-password' : 'default'}
                    returnKeyType="go"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    onFocus={revealFocusedField}
                    onSubmitEditing={submit}
                    error={fieldState.error?.message}
                    trailing={
                      <Pressable
                        accessibilityRole="togglebutton"
                        accessibilityLabel="Show password"
                        accessibilityState={{ checked: showPassword }}
                        onPress={() => setShowPassword((shown) => !shown)}
                        style={({ pressed }) => [styles.eyeButton, pressed && styles.pressed]}
                      >
                        <Feather
                          name={showPassword ? 'eye-off' : 'eye'}
                          size={20}
                          color={palette.textMuted}
                        />
                      </Pressable>
                    }
                  />
                )}
              />
            </View>

            {errors.root?.server ? (
              <Text
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                style={[styles.formError, { color: palette.warning }]}
              >
                {errors.root.server.message}
              </Text>
            ) : null}

            <View style={styles.cta}>
              <AppButton
                title={isSignUp ? 'Create account' : 'Log in'}
                loading={isSubmitting}
                onPress={submit}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    height: 262,
  },
  orbitLine: {
    position: 'absolute',
    left: 110,
    top: 110,
    width: 300,
    height: 300,
    borderRadius: radii.pill,
    borderWidth: 1.5,
  },
  orbitDashed: {
    position: 'absolute',
    left: 60,
    top: 60,
    width: 400,
    height: 400,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  orbitCore: {
    position: 'absolute',
    left: 160,
    top: 160,
    width: 200,
    height: 200,
    borderRadius: radii.pill,
  },
  // Both moons are centred on the orbit line (radius 149.25 around 260, 260).
  orbitDot: {
    position: 'absolute',
    left: 116.7,
    top: 195.5,
    width: 12,
    height: 12,
    borderRadius: radii.pill,
  },
  orbitRing: {
    position: 'absolute',
    left: 169.9,
    top: 130.7,
    width: 12,
    height: 12,
    borderRadius: radii.pill,
    borderWidth: 2,
  },
  header: {
    position: 'absolute',
    top: 64,
    left: spacing.screen,
    gap: spacing.snug,
  },
  wordmark: {
    overflow: 'visible',
    fontFamily: fonts.displayItalic,
    fontSize: fontSizes.wordmark,
    lineHeight: fontSizes.wordmark,
    letterSpacing: letterSpacings.wordmark,
  },
  tagline: {
    maxWidth: 170,
    fontFamily: fonts.body,
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * 1.35,
  },
  sheet: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingTop: spacing.screen,
    paddingHorizontal: spacing.screen,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
  },
  heading: {
    overflow: 'visible',
    fontFamily: fonts.display,
    fontSize: fontSizes.authTitle,
    lineHeight: fontSizes.authTitle * 1.15,
  },
  fields: {
    gap: spacing.sm,
  },
  eyeButton: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  formError: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.meta,
  },
  cta: {
    marginTop: spacing.xxs,
  },
});
