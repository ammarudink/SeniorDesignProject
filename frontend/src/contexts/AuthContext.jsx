import { createContext, useEffect, useMemo, useState } from "react";
import { authService } from "@/services/authService";
import {
  clearSession,
  initializeAuthState,
  persistSession,
} from "@/utils/authStorage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => initializeAuthState());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authState.token || authState.user?.Address) {
      return;
    }

    authService
      .getProfile()
      .then((response) => {
        setAuthState((previous) => ({ ...previous, user: response.data || response }));
      })
      .catch(() => {
        clearSession();
        setAuthState({ token: null, user: null });
      });
  }, [authState.token, authState.user]);

  const value = useMemo(
    () => ({
      user: authState.user,
      token: authState.token,
      loading,
      isAuthenticated: Boolean(authState.token && authState.user),
      isAdmin: authState.user?.Role === "Admin",
      async login(credentials) {
        setLoading(true);
        try {
          const result = await authService.login(credentials);
          persistSession(result);
          setAuthState({ token: result.token, user: result.user });
          return result;
        } finally {
          setLoading(false);
        }
      },
      async register(payload) {
        setLoading(true);
        try {
          const result = await authService.register(payload);
          persistSession(result);
          setAuthState({ token: result.token, user: result.user });
          return result;
        } finally {
          setLoading(false);
        }
      },
      async refreshProfile() {
        const result = await authService.getProfile();
        const user = result.data || result;
        setAuthState((previous) => ({ ...previous, user }));
        persistSession({ token: authState.token, user });
        return user;
      },
      logout() {
        clearSession();
        setAuthState({ token: null, user: null });
      },
    }),
    [authState, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
