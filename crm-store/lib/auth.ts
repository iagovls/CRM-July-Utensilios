import { createClient } from "@/lib/supabase/server";

export type UserClaims = {
  email?: string;
  phone?: string;
  role?: string;
  sub?: string;
  app_metadata?: {
    provider?: string;
    providers?: string[];
    [key: string]: unknown;
  };
  user_metadata?: {
    username?: string;
    name?: string;
    full_name?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export function getDisplayName(
  claims: UserClaims | null | undefined,
  fallback = "Usuário",
): string {
  const emailPrefix = claims?.email?.split("@")[0];
  const meta = claims?.user_metadata;

  return (
    meta?.full_name ||
    meta?.name ||
    meta?.username ||
    emailPrefix ||
    fallback
  );
}

export async function getUserClaims(): Promise<UserClaims | undefined> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims as UserClaims | undefined;
}
