import { Category } from "@/types";
import { getCurrentProjectId, resp, ServiceResponse } from "./services";
import { createClient } from "../supabase/client";

export const categoryService = {
  async getAll(): Promise<ServiceResponse<Category[]>> {
    const supabase = createClient();
    const pid = await getCurrentProjectId();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .eq("project_id", pid)
      .order("name");
    if (error) throw error;
    return resp(data ?? []);
  },

  async create(data: { name: string }): Promise<ServiceResponse<Category>> {
    const supabase = createClient();
    const pid = await getCurrentProjectId();
    const { data: row, error } = await supabase
      .from("categories")
      .insert({ project_id: pid, name: data.name })
      .select()
      .single();
    if (error) throw error;
    return resp(row);
  },

  async update(
    id: string,
    data: { name: string },
  ): Promise<ServiceResponse<Category>> {
    const supabase = createClient();
    const pid = await getCurrentProjectId();
    const { data: row, error } = await supabase
      .from("categories")
      .update({ name: data.name })
      .eq("id", id)
      .eq("project_id", pid)
      .select()
      .single();
    if (error) throw error;
    return resp(row);
  },

  async delete(id: string): Promise<ServiceResponse<void>> {
    const supabase = createClient();
    const pid = await getCurrentProjectId();
    const { error } = await supabase
      .from("categories")
      .update({ is_active: false, deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("project_id", pid);
    if (error) throw error;
    return resp(undefined);
  },
};