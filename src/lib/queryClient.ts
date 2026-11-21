import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';

// One retry, so a stalled query shows its error after about 30 s rather than a minute.
export const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });

AppState.addEventListener('change', (state) => {
  focusManager.setFocused(state === 'active');
});
