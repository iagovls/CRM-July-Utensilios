import { Client, PurchaseHistory } from "@/types";
import { createClient } from "../supabase/client";
import { getCurrentProjectId, resp, ServiceResponse } from "./services";
import { Tables } from "@/types/supabase";

async function normalizeClient(row: Tables<"clients">): Promise<Client> {
  return {
    ...row,
    purchase_history: await buildPurchaseHistory(row.id),
  };
}

export async function buildPurchaseHistory(
  customerId: string,
): Promise<PurchaseHistory[]> {
  const supabase = createClient();
  const pid = await getCurrentProjectId();
  const { data } = await supabase
    .from("sales")
    .select("id, status, total_amount, created_at")
    .eq("customer_id", customerId)
    .eq("project_id", pid)
    .order("created_at", { ascending: false })
    .limit(50);
  if (!data) return [];
  return data.map((s) => ({
    sale_id: s.id,
    status: s.status as PurchaseHistory["status"],
    total_amount: String(s.total_amount ?? 0),
    created_at: s.created_at,
  }));
}



export const clientService = {
  async getAll(): Promise<ServiceResponse<Client[]>> {
    const supabase = createClient();
    const pid = await getCurrentProjectId();
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("is_active", true)
      .eq("project_id", pid)
      .order("name", { nullsFirst: false })
      .order("id");
    if (error) throw error;
    if (!data) return resp([]);
    const normalized = await Promise.all(data.map(normalizeClient));
    return resp(normalized);
  },

  async getById(id: string): Promise<ServiceResponse<Client>> {
    const supabase = createClient();
    const pid = await getCurrentProjectId();
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .eq("project_id", pid)
      .single();
    if (error) throw error;
    if (!data) throw new Error("Cliente não encontrado");
    return resp(await normalizeClient(data));
  },

  async create(data: Partial<Client>): Promise<ServiceResponse<Client>> {
    const supabase = createClient();
    const pid = await getCurrentProjectId();
    const { data: row, error } = await supabase
      .from("clients")
      .insert({
        project_id: pid,
        name: data.name ?? null,
        document: data.document ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        address: data.address ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return resp(await normalizeClient(row));
  },

  async update(
    id: string,
    data: Partial<Client>,
  ): Promise<ServiceResponse<Client>> {
    const supabase = createClient();
    const pid = await getCurrentProjectId();
    const payload: Record<string, unknown> = {};
    if ("name" in data) payload.name = data.name ?? null;
    if ("document" in data) payload.document = data.document ?? null;
    if ("email" in data) payload.email = data.email ?? null;
    if ("phone" in data) payload.phone = data.phone ?? null;
    if ("address" in data) payload.address = data.address ?? null;
    const { data: row, error } = await supabase
      .from("clients")
      .update(payload as never)
      .eq("id", id)
      .eq("project_id", pid)
      .select()
      .single();
    if (error) throw error;
    return resp(await normalizeClient(row));
  },

  async delete(id: string): Promise<ServiceResponse<void>> {
    const supabase = createClient();
    const pid = await getCurrentProjectId();
    const { error } = await supabase
      .from("clients")
      .update({ is_active: false, deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("project_id", pid);
    if (error) throw error;
    return resp(undefined);
  },
};