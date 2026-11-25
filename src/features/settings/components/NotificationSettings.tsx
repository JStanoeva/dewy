import { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useUpdateNudges } from '@/features/profile/hooks/useUpdateNudges';
import type { NudgeSettings, Profile } from '@/features/profile/types';
import { NotificationsOffNote } from '@/features/reminders/components/NotificationsOffNote';
import { NudgeOptions } from '@/features/reminders/components/NudgeOptions';
import { NudgeSwitch } from '@/features/reminders/components/NudgeSwitch';
import {
  eveningTimes,
  expiryLeadDays,
  leadLabels,
  lowUsesThresholds,
  morningTimes,
  nudgeLabels,
  usesLabel,
  type NudgeKind,
} from '@/features/reminders/constants';
import { useNotificationPermission } from '@/features/reminders/hooks/useNotificationPermission';
import { timeLabel } from '@/features/reminders/utils/planReminders';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';

// The four nudges, each saved as it changes, and the note while the phone doesn't let Dewy notify.
export function NotificationSettings({ profile }: { profile: Profile }) {
  const { palette } = useDewyTheme();
  const { session } = useAuth();
  const updateNudges = useUpdateNudges();
  const { permission, ask } = useNotificationPermission();
  // The ref also stops a second tap in the same frame, before the rows redraw as busy.
  const saving = useRef(new Set<NudgeKind>());
  const [savingKinds, setSavingKinds] = useState<readonly NudgeKind[]>([]);
  // Every row waits while Android's question is up.
  const askingRef = useRef(false);
  const [asking, setAsking] = useState(false);
  // The switch shows on from the tap, through Android's question, until its save settles.
  const [turningOn, setTurningOn] = useState<NudgeKind | null>(null);
  const [refused, setRefused] = useState(false);

  const anyOn =
    profile.morningReminderEnabled ||
    profile.eveningReminderEnabled ||
    profile.expiryAlertsEnabled ||
    profile.lowAlertsEnabled;
  const blocked = permission !== null && !permission.allowed && (anyOn || refused);

  function markSaving(kind: NudgeKind, on: boolean) {
    if (on) {
      saving.current.add(kind);
    } else {
      saving.current.delete(kind);
    }
    setSavingKinds([...saving.current]);
  }

  async function askPermission() {
    askingRef.current = true;
    setAsking(true);
    const granted = await ask();
    if (!granted) {
      setRefused(true);
    }
    askingRef.current = false;
    setAsking(false);
    return granted;
  }

  // Turning a nudge on asks first while Dewy may not notify; a refusal saves nothing.
  async function save(kind: NudgeKind, nudges: Partial<NudgeSettings>, turnsOn: boolean) {
    if (!session || saving.current.has(kind) || askingRef.current) {
      return;
    }
    markSaving(kind, true);
    if (turnsOn) {
      setTurningOn(kind);
    }
    try {
      if (turnsOn && !permission?.allowed && !(await askPermission())) {
        return;
      }
      await updateNudges.mutateAsync({ userId: session.user.id, nudges });
    } catch {
      Alert.alert("Couldn't save your nudge", 'Check your connection and try again.');
    } finally {
      markSaving(kind, false);
      setTurningOn((current) => (current === kind ? null : current));
    }
  }

  function busy(kind: NudgeKind) {
    return savingKinds.includes(kind) || asking;
  }

  return (
    <View>
      <View
        style={[styles.card, { backgroundColor: palette.surface, boxShadow: palette.cardShadow }]}
      >
        <NotificationRow
          kind="morning"
          on={profile.morningReminderEnabled || turningOn === 'morning'}
          summary={`Every day at ${timeLabel(profile.morningReminderTime)}`}
          options={morningTimes}
          value={profile.morningReminderTime}
          optionLabel={timeLabel}
          disabled={busy('morning')}
          onToggle={() =>
            save(
              'morning',
              { morningReminderEnabled: !profile.morningReminderEnabled },
              !profile.morningReminderEnabled,
            )
          }
          onPick={(morningReminderTime) => save('morning', { morningReminderTime }, false)}
          divider
        />
        <NotificationRow
          kind="evening"
          on={profile.eveningReminderEnabled || turningOn === 'evening'}
          summary={`Every day at ${timeLabel(profile.eveningReminderTime)}`}
          options={eveningTimes}
          value={profile.eveningReminderTime}
          optionLabel={timeLabel}
          disabled={busy('evening')}
          onToggle={() =>
            save(
              'evening',
              { eveningReminderEnabled: !profile.eveningReminderEnabled },
              !profile.eveningReminderEnabled,
            )
          }
          onPick={(eveningReminderTime) => save('evening', { eveningReminderTime }, false)}
          divider
        />
        <NotificationRow
          kind="expiry"
          on={profile.expiryAlertsEnabled || turningOn === 'expiry'}
          summary={`${leadLabels[profile.expiryLeadDays]} before a product expires`}
          options={expiryLeadDays}
          value={profile.expiryLeadDays}
          optionLabel={(days) => leadLabels[days]}
          disabled={busy('expiry')}
          onToggle={() =>
            save(
              'expiry',
              { expiryAlertsEnabled: !profile.expiryAlertsEnabled },
              !profile.expiryAlertsEnabled,
            )
          }
          onPick={(expiryLeadDays) => save('expiry', { expiryLeadDays }, false)}
          divider
        />
        <NotificationRow
          kind="low"
          on={profile.lowAlertsEnabled || turningOn === 'low'}
          summary={`When about ${usesLabel(profile.lowUsesThreshold)} are left`}
          options={lowUsesThresholds}
          value={profile.lowUsesThreshold}
          optionLabel={usesLabel}
          disabled={busy('low')}
          onToggle={() =>
            save('low', { lowAlertsEnabled: !profile.lowAlertsEnabled }, !profile.lowAlertsEnabled)
          }
          onPick={(lowUsesThreshold) => save('low', { lowUsesThreshold }, false)}
        />
      </View>
      {blocked ? (
        <NotificationsOffNote
          onAllow={
            permission.canAsk && !refused
              ? () => {
                  if (!askingRef.current) {
                    askPermission();
                  }
                }
              : undefined
          }
          style={styles.note}
        />
      ) : null}
    </View>
  );
}

type NotificationRowProps<T extends string | number> = {
  kind: NudgeKind;
  on: boolean;
  summary: string;
  options: readonly T[];
  value: T;
  optionLabel: (option: T) => string;
  disabled: boolean;
  onToggle: () => void;
  onPick: (option: T) => void;
  divider?: boolean;
};

function NotificationRow<T extends string | number>({
  kind,
  on,
  summary,
  options,
  value,
  optionLabel,
  disabled,
  onToggle,
  onPick,
  divider = false,
}: NotificationRowProps<T>) {
  const { palette } = useDewyTheme();
  const { label, optionsLabel } = nudgeLabels[kind];

  return (
    <View style={divider && [styles.divider, { borderBottomColor: palette.divider }]}>
      <View style={styles.row}>
        <View style={styles.text}>
          <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
          <Text style={[styles.summary, { color: palette.textMuted }]}>{on ? summary : 'Off'}</Text>
        </View>
        <NudgeSwitch label={label} on={on} disabled={disabled} onToggle={onToggle} />
      </View>
      {on ? (
        <NudgeOptions
          label={optionsLabel}
          options={options}
          value={value}
          optionLabel={optionLabel}
          disabled={disabled}
          onPick={onPick}
          style={styles.options}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingRight: spacing.md,
    paddingLeft: spacing.xl,
    borderRadius: radii.card,
  },
  divider: {
    borderBottomWidth: 1,
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.body,
  },
  summary: {
    fontFamily: fonts.body,
    fontSize: fontSizes.meta,
  },
  options: {
    paddingBottom: 14,
  },
  note: {
    marginTop: spacing.xs,
    marginHorizontal: spacing.xxs,
  },
});
