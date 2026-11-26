import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, type ReactNode } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { ErrorState } from '@/components/ErrorState';
import { FormHeader, formHeaderBottom } from '@/components/FormHeader';
import { FormScrollView } from '@/components/FormScrollView';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { SkinPillPicker } from '@/features/profile/components/SkinPillPicker';
import { SkinTypePicker } from '@/features/profile/components/SkinTypePicker';
import {
  skinConcernLabels,
  skinConcerns,
  skinGoalLabels,
  skinGoals,
} from '@/features/profile/constants';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useUpdateSkinDetails } from '@/features/profile/hooks/useUpdateSkinDetails';
import { skinDetailsSchema, type SkinDetails } from '@/features/profile/schemas/skinDetailsSchema';
import type { Profile } from '@/features/profile/types';
import type { RootStackParamList } from '@/navigation/types';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, letterSpacings, minTouchTarget, spacing } from '@/theme/tokens';

type SkinDetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'SkinDetails'>;
type Navigation = SkinDetailsScreenProps['navigation'];

// The design leaves 28 under the button for the system bar; taller insets get a small gap instead.
const MIN_BOTTOM_SPACE = 28;

// The form reads its starting values once, so it mounts only after the profile has loaded.
export function SkinDetailsScreen({ navigation }: SkinDetailsScreenProps) {
  const profile = useProfile();

  if (profile.data) {
    return <SkinDetailsForm profile={profile.data} navigation={navigation} />;
  }

  return (
    <Screen edges={['left', 'right']}>
      <FormHeader title="Skin details" onClose={() => navigation.goBack()} />
      <View style={styles.inset}>
        {profile.isError ? (
          <ErrorState
            message="We couldn't load your skin details. Check your connection and try again."
            onRetry={() => profile.refetch()}
            retrying={profile.isFetching}
          />
        ) : (
          <LoadingState />
        )}
      </View>
    </Screen>
  );
}

type SkinDetailsFormProps = {
  profile: Profile;
  navigation: Navigation;
};

function SkinDetailsForm({ profile, navigation }: SkinDetailsFormProps) {
  const { palette } = useDewyTheme();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const updateSkinDetails = useUpdateSkinDetails();
  // isPending only changes on the next render, so two taps in one frame would both send.
  const sending = useRef(false);
  const {
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { isDirty, errors },
  } = useForm<SkinDetails>({
    resolver: zodResolver(skinDetailsSchema),
    defaultValues: {
      skinType: profile.skinType,
      concerns: profile.concerns,
      skinGoals: profile.skinGoals,
    },
  });
  const [skinType, concerns, goals] = useWatch({
    control,
    name: ['skinType', 'concerns', 'skinGoals'],
  });
  const hasAny = skinType !== null || concerns.length > 0 || goals.length > 0;
  const saving = updateSkinDetails.isPending;

  async function onSubmit(values: SkinDetails) {
    if (!isDirty) {
      navigation.goBack();
      return;
    }
    if (!session) {
      return;
    }
    try {
      await updateSkinDetails.mutateAsync({ userId: session.user.id, details: values });
    } catch {
      setError('root.server', {
        message: "Couldn't save your skin details. Check your connection and try again.",
      });
      return;
    }
    if (navigation.isFocused()) {
      navigation.goBack();
    }
  }

  function submit() {
    if (saving || sending.current) {
      return;
    }
    sending.current = true;
    handleSubmit(onSubmit)().finally(() => {
      sending.current = false;
    });
  }

  function clearAll() {
    setValue('skinType', null, { shouldDirty: true });
    setValue('concerns', [], { shouldDirty: true });
    setValue('skinGoals', [], { shouldDirty: true });
  }

  return (
    <Screen edges={['left', 'right']}>
      <FormHeader title="Skin details" onClose={() => navigation.goBack()} />

      <FormScrollView topOffset={formHeaderBottom} contentContainerStyle={styles.content}>
        <View>
          <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>
            Your <Text style={[styles.titleItalic, { color: palette.emphasis }]}>skin</Text>
          </Text>
          <Text style={[styles.subline, { color: palette.textMuted }]}>
            All optional. Pick what feels true today, and change it anytime.
          </Text>
        </View>

        {/* The picks hold still while saving, so the saved details are the ones on screen. */}
        <View style={[styles.sections, { pointerEvents: saving ? 'none' : 'auto' }]}>
          <Section label="Skin type" hint="Tap again to clear">
            <Controller
              control={control}
              name="skinType"
              render={({ field }) => (
                <SkinTypePicker value={field.value} onChange={field.onChange} />
              )}
            />
          </Section>

          <Section label="Concerns" note="what's bothering your skin" hint="Pick any">
            <Controller
              control={control}
              name="concerns"
              render={({ field }) => (
                <SkinPillPicker
                  options={skinConcerns}
                  labels={skinConcernLabels}
                  value={field.value}
                  onChange={field.onChange}
                  pickedBackground={palette.peach}
                  pickedBorder={palette.rose}
                />
              )}
            />
          </Section>

          <Section label="Goals" note="what you'd like to see" hint="Pick any">
            <Controller
              control={control}
              name="skinGoals"
              render={({ field }) => (
                <SkinPillPicker
                  options={skinGoals}
                  labels={skinGoalLabels}
                  value={field.value}
                  onChange={field.onChange}
                  pickedBackground={palette.lilac}
                  pickedBorder={palette.mauve}
                />
              )}
            />
          </Section>

          {hasAny ? (
            <Pressable
              accessibilityRole="button"
              onPress={clearAll}
              style={({ pressed }) => [styles.clear, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={[styles.clearLabel, { color: palette.warning }]}>
                Clear my skin details
              </Text>
            </Pressable>
          ) : null}
        </View>
      </FormScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom + spacing.xs, MIN_BOTTOM_SPACE) },
        ]}
      >
        {errors.root?.server?.message ? (
          <Text
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[styles.formError, { color: palette.warning }]}
          >
            {errors.root.server.message}
          </Text>
        ) : null}
        <AppButton pinned title="Save" loading={saving} onPress={submit} />
      </View>
    </Screen>
  );
}

type SectionProps = {
  label: string;
  // The muted words after the label, as "Concerns · what's bothering your skin".
  note?: string;
  hint: string;
  children: ReactNode;
};

function Section({ label, note, hint, children }: SectionProps) {
  const { palette } = useDewyTheme();
  return (
    <View>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: palette.text }]}>
          {label}
          {note ? (
            <Text style={[styles.labelNote, { color: palette.textMuted }]}> · {note}</Text>
          ) : null}
        </Text>
        <Text style={[styles.hint, { color: palette.textMuted }]}>{hint}</Text>
      </View>
      <View style={styles.picker}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 18,
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.screen,
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
  subline: {
    marginTop: spacing.xs,
    fontFamily: fonts.body,
    fontSize: fontSizes.secondary,
    lineHeight: fontSizes.secondary * 1.45,
  },
  sections: {
    gap: 18,
  },
  labelRow: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  label: {
    flexShrink: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.meta,
  },
  labelNote: {
    fontFamily: fonts.bodyMedium,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.kicker,
  },
  picker: {
    marginTop: spacing.xs,
  },
  clear: {
    alignSelf: 'center',
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  clearLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.secondary,
  },
  footer: {
    gap: spacing.xs,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.screen,
  },
  formError: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.meta,
  },
});
