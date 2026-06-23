import api from "./api";
import { AuthTokens, User } from "@/types";

type ApiUser = Omit<User, "is_admin_role"> & {
  role?: "admin" | "user";
  is_admin_role?: boolean;
};

function normalizeUser(user: ApiUser): User {
  return {
    ...user,
    is_admin_role: user.is_admin_role ?? user.role === "admin",
  };
}

export const authService = {
  async login(username: string, password: string): Promise<AuthTokens> {
    const response = await api.post<AuthTokens>("/api/auth/login/", {
      username,
      password,
    });
    return response.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post("/api/auth/logout/", { refresh: refreshToken });
  },

  async getMe(): Promise<User> {
    const response = await api.get<ApiUser>("/api/auth/me/");
    return normalizeUser(response.data);
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await api.post("/api/auth/change-password/", {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },

  setTokens(tokens: AuthTokens) {
    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);
  },

  getTokens(): AuthTokens | null {
    if (typeof window === "undefined") return null;
    const access = localStorage.getItem("access_token");
    const refresh = localStorage.getItem("refresh_token");
    if (!access || !refresh) return null;
    return { access, refresh };
  },

  clearTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },

  hasValidTokens(): boolean {
    return !!this.getTokens();
  },
};
