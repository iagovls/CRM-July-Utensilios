import { authService } from "@/lib/auth";
import { User } from "@/types";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
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
    } catch (error) {
      console.error("Error refreshing user:", error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    const initAuth = async () => {
      try {
        await refreshUser();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
      unsubscribe = await authService.subscribeAuthChanges((u) => {
        if (!cancelled) setUser(u);
      });
    };
    initAuth();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [refreshUser]);

  const login = async (identifier: string, password: string) => {
    await authService.login(identifier, password);
    await refreshUser();
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
