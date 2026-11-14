import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { supabase } from '@/lib/supabase';

type AuthValue = {
  session: Session | null;
  isRestoring: boolean;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Offline, auth-js retries an expired token's refresh for ~25 s before its first event, so cap the splash wait.
    const restoreCap = setTimeout(() => setIsRestoring(false), 5000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const nextUserId = nextSession?.user.id ?? null;
      if (userIdRef.current !== null && userIdRef.current !== nextUserId) {
        queryClient.clear();
        // Product photos are cached on the device too, so the next account starts without them.
        Image.clearMemoryCache();
        Image.clearDiskCache();
      }
      userIdRef.current = nextUserId;
      setSession(nextSession);
      setIsRestoring(false);
    });

    return () => {
      clearTimeout(restoreCap);
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const value = useMemo(() => ({ session, isRestoring }), [session, isRestoring]);

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
