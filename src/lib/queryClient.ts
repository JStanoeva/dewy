import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';

export const queryClient = new QueryClient();

AppState.addEventListener('change', (state) => {
  focusManager.setFocused(state === 'active');
});
