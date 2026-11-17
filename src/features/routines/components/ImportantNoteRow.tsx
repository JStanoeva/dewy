import { useWatch, type Control } from 'react-hook-form';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import type {
  RoutineStepFormValues,
  RoutineStepInput,
} from '@/features/routines/schemas/routineStepSchema';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, spacing } from '@/theme/tokens';

type ImportantNoteRowProps = {
  control: Control<RoutineStepFormValues, unknown, RoutineStepInput>;
  // Reads the form's current value, so quick taps that land before a re-render all count.
  onToggle: () => void;
  disabled: boolean;
};

// Watches the note itself, so a keystroke re-renders only this row.
export function ImportantNoteRow({ control, onToggle, disabled }: ImportantNoteRowProps) {
  const { palette } = useDewyTheme();
  const note = useWatch({ control, name: 'note' });
  const important = useWatch({ control, name: 'noteImportant' });
  const hasNote = note.trim().length > 0;
  const off = disabled || !hasNote;
  const subline = hasNote ? 'Shows this note on Today' : 'Write a note to show it on Today';

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel="Important"
      accessibilityHint={subline}
      accessibilityState={{ checked: important, disabled: off }}
      disabled={off}
      onPress={onToggle}
      style={[styles.row, !hasNote && styles.dimmed]}
    >
      <View style={styles.text}>
        <Text style={[styles.title, { color: palette.text }]}>Important</Text>
        <Text style={[styles.subline, { color: palette.textMuted }]}>{subline}</Text>
      </View>
      {/* The row speaks for the switch, so TalkBack finds one node. */}
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Switch
          value={important}
          onValueChange={onToggle}
          disabled={off}
          trackColor={{ false: palette.switchOff, true: palette.primary }}
          thumbColor={palette.switchThumb}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  dimmed: {
    opacity: 0.4,
  },
  text: {
    flex: 1,
    gap: spacing.hairline,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.body,
  },
  subline: {
    fontFamily: fonts.body,
    fontSize: fontSizes.meta,
  },
});
