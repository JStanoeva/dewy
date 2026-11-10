import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';
import { formatLocalDate, parseLocalDate, toLocalDate, type LocalDate } from '@/utils/localDate';

type DateFieldProps = {
  label: string;
  value: LocalDate | null;
  onChange: (value: LocalDate) => void;
  placeholder: string;
  minimumDate: Date;
  maximumDate: Date;
  invalid?: boolean;
  style?: StyleProp<ViewStyle>;
};

// A compact external-label field that opens the Android date dialog.
export function DateField({
  label,
  value,
  onChange,
  placeholder,
  minimumDate,
  maximumDate,
  invalid = false,
  style,
}: DateFieldProps) {
  const { palette } = useDewyTheme();

  function openPicker() {
    Keyboard.dismiss();
    DateTimePickerAndroid.open({
      mode: 'date',
      value: value ? parseLocalDate(value) : maximumDate,
      minimumDate,
      maximumDate,
      onValueChange: (_event, date) => onChange(toLocalDate(date)),
    });
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value ? formatLocalDate(value) : placeholder}`}
        accessibilityHint="Opens a calendar"
        onPress={openPicker}
        style={({ pressed }) => [
          styles.box,
          {
            backgroundColor: palette.surface,
            borderColor: invalid ? palette.warning : palette.mauve,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Text
          numberOfLines={1}
          style={[styles.value, { color: value ? palette.text : palette.placeholder }]}
        >
          {value ? formatLocalDate(value) : placeholder}
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
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radii.tile,
  },
  value: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.secondary,
  },
});
