import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import client, { setAuthContextRef } from "../api/client";

const AuthContext = createContext(null);

const initialAuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  role: null,
};

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(initialAuthState);

  const setAccessToken = useCallback((accessToken) => {
    setAuthState((previous) => ({ ...previous, accessToken }));
  }, []);

  const clearAuth = useCallback(() => {
    setAuthState(initialAuthState);
  }, []);

  useEffect(() => {
    setAuthContextRef({
      accessToken: authState.accessToken,
      refreshToken: authState.refreshToken,
      setAccessToken,
      clearAuth,
    });
  }, [
    authState.accessToken,
    authState.refreshToken,
    clearAuth,
    setAccessToken,
  ]);

  const login = useCallback(async (email, password) => {
    const response = await client.post("/auth/login/", { email, password });
    const { access, refresh, role, user } = response.data;
    setAuthState({ user, accessToken: access, refreshToken: refresh, role });
    return response.data;
  }, []);

  const signup = useCallback(async (payload) => {
    const response = await client.post("/auth/signup/", payload);
    return response.data;
  }, []);

  const logout = useCallback(() => {
    setAuthState(initialAuthState);
  }, []);

  const value = useMemo(
    () => ({
      ...authState,
      login,
      signup,
      logout,
    }),
    [authState, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
