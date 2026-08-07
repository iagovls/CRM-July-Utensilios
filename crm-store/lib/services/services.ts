"use client";

import { createClient } from "@/lib/supabase/client";


export const PROJECT_SLUG =
  process.env.NEXT_PUBLIC_PROJECT_SLUG ?? "july-utensilios";

let _cachedProjectId: string | null = null;
export async function getCurrentProjectId(): Promise<string> {
  if (_cachedProjectId) return _cachedProjectId;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("slug", PROJECT_SLUG)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error(
      `Projeto com slug "${PROJECT_SLUG}" não encontrado. Verifique NEXT_PUBLIC_PROJECT_SLUG.`,
    );
  }
  _cachedProjectId = data.id;
  return data.id;
}

export interface ServiceResponse<T> {
  data: T;
}

export function resp<T>(data: T): ServiceResponse<T> {
  return { data };
}

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return 0;
  return n;
}

export function toMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "0000-00";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}













