import { AppProviders } from '@/app/AppProviders';
import { ConfigErrorScreen } from '@/config/ConfigErrorScreen';
import { envProblems } from '@/config/env';
import { AuthScreen } from '@/features/auth/screens/AuthScreen';
import { MorningTheme } from '@/theme/ThemeProvider';

export default function App() {
  return (
    <AppProviders>
      {envProblems.length > 0 ? (
        <ConfigErrorScreen problems={envProblems} />
      ) : (
        <MorningTheme>
          <AuthScreen />
        </MorningTheme>
      )}
    </AppProviders>
  );
}
