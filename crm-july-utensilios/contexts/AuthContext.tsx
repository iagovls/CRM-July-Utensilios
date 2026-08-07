import { authService } from "@/lib/auth";
import { User } from "@/types";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    let mounted = true;

    const apply = (u: User | null) => {
      if (!cancelled && mounted) setUser(u);
    };

    const initAuth = async () => {
      unsubscribe = await authService.subscribeAuthChanges(apply);
      try {
        await refreshUser();
      } catch {
        // refreshUser already handles resetting user state on error
      } finally {
        if (!cancelled && mounted) setIsLoading(false);
      }
    };
    initAuth();

    return () => {
      cancelled = true;
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [refreshUser]);

  const login = async (identifier: string, password: string) => {
    await authService.login(identifier, password);
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await refreshUser();
        return;
      } catch (error) {
        lastError = error;
        await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
      }
    }
    try {
      await authService.logout();
    } catch {
      // ignore cleanup errors
    }
    throw lastError instanceof Error
      ? lastError
      : new Error(String(lastError ?? "Erro ao carregar o perfil após login."));
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
