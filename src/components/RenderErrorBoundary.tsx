import * as SplashScreen from 'expo-splash-screen';
import { Component, useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/ErrorState';
import { Screen } from '@/components/Screen';
import { spacing } from '@/theme/tokens';

type RenderErrorBoundaryProps = {
  children: ReactNode;
};

type RenderErrorBoundaryState = {
  failed: boolean;
};

// Catches an error thrown while drawing, so the app shows Try again instead of closing.
export class RenderErrorBoundary extends Component<
  RenderErrorBoundaryProps,
  RenderErrorBoundaryState
> {
  state: RenderErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): RenderErrorBoundaryState {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <RenderErrorScreen onRetry={() => this.setState({ failed: false })} />;
    }
    return this.props.children;
  }
}

function RenderErrorScreen({ onRetry }: { onRetry: () => void }) {
  // The error can come before the navigator is ready, which is what normally hides the splash.
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <Screen>
      <View style={styles.content}>
        <ErrorState message="Dewy couldn't show this screen." onRetry={onRetry} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.screen,
  },
});
