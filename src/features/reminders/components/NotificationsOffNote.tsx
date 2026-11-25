import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, minTouchTarget } from '@/theme/tokens';

type NotificationsOffNoteProps = {
  // Given while Dewy may still ask on this phone: the note offers Android's question instead of its settings.
  onAllow?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function NotificationsOffNote({ onAllow, style }: NotificationsOffNoteProps) {
  const { palette } = useDewyTheme();
  const linkLabel = onAllow ? 'Allow notifications' : 'Open settings';

  return (
    <View style={[styles.note, style]}>
      <Text
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[styles.noteText, { color: palette.textMuted }]}
      >
        {onAllow
          ? "Dewy can't send your nudges on this phone yet."
          : "Notifications are off for Dewy. Allow them in your phone's settings to get nudges."}
      </Text>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={linkLabel}
        onPress={onAllow ?? (() => Linking.openSettings())}
        style={({ pressed }) => [styles.link, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Text style={[styles.linkText, { color: palette.text }]}>{linkLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    alignItems: 'flex-start',
  },
  noteText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.meta,
    lineHeight: fontSizes.meta * 1.45,
  },
  link: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
  },
  linkText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.meta,
    textDecorationLine: 'underline',
  },
});
