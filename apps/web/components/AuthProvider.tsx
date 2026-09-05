"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  api,
  clearAccessToken,
  setAccessToken,
  type AuthUser,
} from "../lib/api";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const currentUser = await api.auth.me();

        if (!cancelled) {
          setUser(currentUser);
        }
      } catch {
        clearAccessToken();

        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function login(email: string, password: string) {
    const response = await api.auth.login({
      email,
      password,
    });

    setAccessToken(response.accessToken);
    setUser(response.user);
  }

  async function register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) {
    const response = await api.auth.register({
      email,
      password,
      firstName,
      lastName,
    });

    setAccessToken(response.accessToken);
    setUser(response.user);
  }

  function logout() {
    clearAccessToken();
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
    }),
    [user, loading],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}