import { useNavigation } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, letterSpacings, spacing } from '@/theme/tokens';

export function RoutinesScreen() {
  const { palette } = useDewyTheme();
  const navigation = useNavigation();

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>
          Your <Text style={[styles.titleItalic, { color: palette.emphasis }]}>rituals</Text>
        </Text>
        <EmptyState
          title="Add a product first"
          message="Routine steps use products you own, so start with your shelf."
          action={{
            label: 'Add a product',
            onPress: () => navigation.navigate('ProductForm', { status: 'owned' }),
          }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingTop: 56,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.screen,
  },
  title: {
    overflow: 'visible',
    fontFamily: fonts.display,
    fontSize: fontSizes.titleLarge,
    lineHeight: fontSizes.titleLarge * 1.1,
    letterSpacing: letterSpacings.title,
  },
  titleItalic: {
    fontFamily: fonts.displayItalic,
  },
});
