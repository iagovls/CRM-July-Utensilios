"use client";

import { createClient } from "@/lib/supabase/client";
import { User } from "@/types";
import type { User as SupabaseUser } from "@supabase/supabase-js";

function deriveUsername(authUser: SupabaseUser | null): string {
  if (!authUser) return "";
  if (authUser.user_metadata?.username) {
    return String(authUser.user_metadata.username);
  }
  if (authUser.email) {
    return authUser.email.split("@")[0];
  }
  return authUser.id.slice(0, 8);
}

function deriveName(authUser: SupabaseUser | null): { first_name: string; last_name: string } {
  if (!authUser) return { first_name: "", last_name: "" };
  const raw = String(
    authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.email ||
      ""
  );
  const parts = raw.trim().split(/\s+/);
  const first_name = parts[0] || "";
  const last_name = parts.slice(1).join(" ") || "";
  return { first_name, last_name };
}

function normalizeUser(authUser: SupabaseUser | null, role?: "admin" | "user" | "viewer" | null): User {
  const is_admin = role === "admin";
  const { first_name, last_name } = deriveName(authUser);
  return {
    id: authUser?.id ?? "",
    username: deriveUsername(authUser),
    email: authUser?.email ?? "",
    first_name,
    last_name,
    role: (role as "admin" | "user" | undefined) || (is_admin ? "admin" : "user"),
    is_admin_role: is_admin,
    is_active: authUser?.aud !== null ? true : false,
    last_login: authUser?.last_sign_in_at ?? null,
  };
}

export const PROJECT_SLUG = process.env.NEXT_PUBLIC_PROJECT_SLUG ?? "july-utensilios";

let _cachedProjectId: string | null = null;
async function getCurrentProjectId(): Promise<string> {
  if (_cachedProjectId) return _cachedProjectId;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", PROJECT_SLUG)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data?.id) {
      _cachedProjectId = data.id;
      return data.id;
    }
    const { data: anyProj, error: anyErr } = await supabase
      .from("projects")
      .select("id")
      .limit(1)
      .maybeSingle();
    if (anyErr) throw anyErr;
    if (anyProj?.id) {
      _cachedProjectId = anyProj.id;
      return anyProj.id;
    }
    throw new Error(
      `Nenhum projeto encontrado (slug="${PROJECT_SLUG}"). Verifique NEXT_PUBLIC_PROJECT_SLUG e a tabela public.projects.`
    );
  } catch (err) {
    console.error("[auth.getCurrentProjectId] Falhou:", err);
    throw err;
  }
}

export const authService = {
  async login(identifier: string, password: string): Promise<void> {
    const supabase = createClient();
    const looksLikeEmail = /@/.test(identifier);

    let email = identifier;
    if (!looksLikeEmail) {
      email = identifier;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const pid = await getCurrentProjectId();
    const { data: isMember, error: memberErr } = await (
      supabase.rpc as unknown as (
        fn: string,
        args?: Record<string, unknown>
      ) => Promise<{ data: unknown; error: unknown }>
    )("is_project_member", { pid });
    if (memberErr) {
      void supabase.auth.signOut().catch(() => undefined);
      throw memberErr as Error;
    }
    if (!isMember) {
      await supabase.auth.signOut().catch(() => undefined);
      throw new Error("NOT_PROJECT_MEMBER");
    }
  },

  async logout(): Promise<void> {
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn("[auth.logout] warning:", error.message);
      }
    } finally {
      _cachedProjectId = null;
    }
  },

  async getCurrentAuthUser(): Promise<SupabaseUser | null> {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;
    return data.user;
  },

  async getMe(): Promise<User> {
    const supabase = createClient();
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData.user) {
      throw new Error("Unauthorized");
    }
    const authUser = authData.user;

    const pid = await getCurrentProjectId();
    const callRpc = (
      fn: string,
      args?: Record<string, unknown>
    ): Promise<{ data: unknown; error: unknown }> =>
      supabase.rpc(fn, args) as Promise<{ data: unknown; error: unknown }>;

    const [{ data: isMember, error: memberErr }, { data: projectRole, error: roleErr }] =
      await Promise.all([
        callRpc("is_project_member", { pid }),
        callRpc("get_project_role", { pid }),
      ]);

    if (memberErr) throw memberErr as Error;
    if (!isMember) {
      await supabase.auth.signOut().catch(() => undefined);
      throw new Error("Unauthorized");
    }
    if (roleErr) throw roleErr as Error;

    const role: "admin" | "user" | "viewer" = (projectRole as "admin" | "user" | "viewer") || "user";

    return normalizeUser(authUser, role);
  },

  async subscribeAuthChanges(cb: (user: User | null) => void): Promise<() => void> {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        cb(null);
        return;
      }
      try {
        const me = await this.getMe();
        cb(me);
      } catch {
        cb(null);
      }
    });
    return () => subscription.unsubscribe();
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const supabase = createClient();
    const { data: signInData, error: signInErr } = await supabase.auth.getUser();
    if (signInErr || !signInData.user?.email) {
      throw new Error("Você precisa estar logado para alterar a senha.");
    }
    const email = signInData.user.email;
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email,
      password: oldPassword,
    });
    if (verifyErr) {
      throw new Error("Senha atual incorreta.");
    }
    const { error: updateErr } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (updateErr) throw updateErr;
  },

  setTokens() {
    return;
  },

  getTokens() {
    return null;
  },

  clearTokens() {
    return;
  },

  hasValidTokens(): boolean {
    return false;
  },
};
