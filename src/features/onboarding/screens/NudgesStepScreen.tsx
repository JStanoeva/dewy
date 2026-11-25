import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { OnboardingHeader } from '@/features/onboarding/components/OnboardingHeader';
import { useOnboardingDraft } from '@/features/onboarding/providers/OnboardingDraftProvider';
import { useFinishOnboarding } from '@/features/profile/hooks/useFinishOnboarding';
import { NotificationsOffNote } from '@/features/reminders/components/NotificationsOffNote';
import { NudgeCard } from '@/features/reminders/components/NudgeCard';
import {
  eveningTimes,
  expiryLeadDays,
  leadLabels,
  lowUsesThresholds,
  morningTimes,
  usesLabel,
} from '@/features/reminders/constants';
import { requestNotificationPermission } from '@/features/reminders/services/notificationService';
import { timeLabel } from '@/features/reminders/utils/planReminders';
import type { RootStackParamList } from '@/navigation/types';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, letterSpacings, radii, spacing } from '@/theme/tokens';

type NudgesStepScreenProps = NativeStackScreenProps<RootStackParamList, 'NudgesStep'>;

const MIN_BOTTOM_SPACE = 28;

export function NudgesStepScreen({ navigation, route }: NudgesStepScreenProps) {
  const { palette } = useDewyTheme();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { nudges, updateNudges, nudgesRefused, refuseNudges } = useOnboardingDraft();
  const finishOnboarding = useFinishOnboarding();
  const [starting, setStarting] = useState(false);
  const [failed, setFailed] = useState(false);
  const startingRef = useRef(false);

  const anyOn =
    nudges.morningReminderEnabled ||
    nudges.eveningReminderEnabled ||
    nudges.expiryAlertsEnabled ||
    nudges.lowAlertsEnabled;

  // A nudge needs permission first; a refusal turns every switch off, and the next tap saves them off.
  async function start() {
    if (startingRef.current || !session) {
      return;
    }
    startingRef.current = true;
    setStarting(true);
    setFailed(false);
    try {
      if (anyOn && !(await requestNotificationPermission())) {
        refuseNudges();
        setStarting(false);
        return;
      }
      await finishOnboarding.mutateAsync({
        userId: session.user.id,
        steps: route.params.steps,
        nudges,
      });
    } catch {
      setStarting(false);
      setFailed(true);
    } finally {
      startingRef.current = false;
    }
  }

  return (
    <Screen edges={['left', 'right']}>
      <View
        pointerEvents="none"
        style={[styles.circle, { backgroundColor: palette.onboardingNudgesCircle }]}
      />
      <OnboardingHeader step={3} onBack={() => navigation.goBack()} disabled={starting} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.kicker, { color: palette.textMuted }]}>Step 3 of 3 · Your nudges</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>
          When should we{' '}
          <Text style={[styles.titleItalic, { color: palette.emphasis }]}>nudge</Text> you?
        </Text>

        <View style={styles.list}>
          <NudgeCard
            kind="morning"
            on={nudges.morningReminderEnabled}
            summary={`Every day at ${timeLabel(nudges.morningReminderTime)}`}
            options={morningTimes}
            value={nudges.morningReminderTime}
            optionLabel={timeLabel}
            disabled={starting}
            onToggle={() =>
              updateNudges({ morningReminderEnabled: !nudges.morningReminderEnabled })
            }
            onPick={(morningReminderTime) => updateNudges({ morningReminderTime })}
          />
          <NudgeCard
            kind="evening"
            on={nudges.eveningReminderEnabled}
            summary={`Every day at ${timeLabel(nudges.eveningReminderTime)}`}
            options={eveningTimes}
            value={nudges.eveningReminderTime}
            optionLabel={timeLabel}
            disabled={starting}
            onToggle={() =>
              updateNudges({ eveningReminderEnabled: !nudges.eveningReminderEnabled })
            }
            onPick={(eveningReminderTime) => updateNudges({ eveningReminderTime })}
          />
          <NudgeCard
            kind="expiry"
            on={nudges.expiryAlertsEnabled}
            summary={`${leadLabels[nudges.expiryLeadDays]} before a product expires`}
            options={expiryLeadDays}
            value={nudges.expiryLeadDays}
            optionLabel={(days) => leadLabels[days]}
            disabled={starting}
            onToggle={() => updateNudges({ expiryAlertsEnabled: !nudges.expiryAlertsEnabled })}
            onPick={(expiryLeadDays) => updateNudges({ expiryLeadDays })}
          />
          <NudgeCard
            kind="low"
            on={nudges.lowAlertsEnabled}
            summary={`When about ${usesLabel(nudges.lowUsesThreshold)} are left`}
            options={lowUsesThresholds}
            value={nudges.lowUsesThreshold}
            optionLabel={usesLabel}
            disabled={starting}
            onToggle={() => updateNudges({ lowAlertsEnabled: !nudges.lowAlertsEnabled })}
            onPick={(lowUsesThreshold) => updateNudges({ lowUsesThreshold })}
          />
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom + spacing.xs, MIN_BOTTOM_SPACE) },
        ]}
      >
        {nudgesRefused ? <NotificationsOffNote /> : null}
        {failed && !starting ? (
          <Text
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[styles.error, { color: palette.warning }]}
          >
            We couldn&apos;t save your rituals. Check your connection and try again.
          </Text>
        ) : null}
        <AppButton pinned ink title="Start my ritual" loading={starting} onPress={start} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  circle: {
    position: 'absolute',
    top: -150,
    right: -120,
    width: 280,
    height: 280,
    borderRadius: radii.pill,
  },
  content: {
    paddingTop: spacing.screen,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.screen,
  },
  kicker: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.kicker,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: spacing.xs,
    overflow: 'visible',
    fontFamily: fonts.display,
    fontSize: fontSizes.formTitle,
    lineHeight: fontSizes.formTitle * 1.12,
    letterSpacing: letterSpacings.title,
  },
  titleItalic: {
    fontFamily: fonts.displayItalic,
  },
  list: {
    marginTop: 18,
    gap: spacing.sm,
  },
  footer: {
    gap: spacing.xs,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.screen,
  },
  error: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.meta,
  },
});
