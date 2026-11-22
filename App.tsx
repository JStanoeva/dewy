import { AppProviders } from '@/app/AppProviders';
import { RenderErrorBoundary } from '@/components/RenderErrorBoundary';
import { ConfigErrorScreen } from '@/config/ConfigErrorScreen';
import { envProblems } from '@/config/env';
import { RootNavigator } from '@/navigation/RootNavigator';

export default function App() {
  return (
    <AppProviders>
      {envProblems.length > 0 ? (
        <ConfigErrorScreen problems={envProblems} />
      ) : (
        <RenderErrorBoundary>
          <RootNavigator />
        </RenderErrorBoundary>
      )}
    </AppProviders>
  );
}
