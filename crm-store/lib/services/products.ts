import { Product } from "@/types";
import { createClient } from "../supabase/client";
import { getCurrentProjectId, resp, ServiceResponse } from "./services";
import { Tables } from "@/types/supabase";

async function normalizeProduct(row: Tables<"products">): Promise<Product> {
  const supabase = createClient();
  const pid = await getCurrentProjectId();
  const [imgRes, movRes] = await Promise.all([
    supabase
      .from("product_images")
      .select("*")
      .eq("product_id", row.id)
      .eq("project_id", pid),
    supabase
      .from("stock_movements")
      .select(
        "id, product_id, project_id, movement_type, quantity, notes, created_at, updated_at, actor_id",
      )
      .eq("product_id", row.id)
      .eq("project_id", pid)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  return {
    ...row,
    images: (imgRes.data ?? []).map((i) => ({ ...i, image: i.image_url })),
    movements: (movRes.data ?? []).map((m) => ({
      ...m,
      actor_name: "",
    })),
  };
}

export const productService = {
  async getAll(): Promise<ServiceResponse<Product[]>> {
    const supabase = createClient();
    const pid = await getCurrentProjectId();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("project_id", pid)
      .order("name", { nullsFirst: false });
    if (error) throw error;
    const normalized = await Promise.all((data ?? []).map(normalizeProduct));
    return resp(normalized);
  },

  async getById(id: string): Promise<ServiceResponse<Product>> {
    const supabase = createClient();
    const pid = await getCurrentProjectId();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("project_id", pid)
      .single();
    if (error) throw error;
    if (!data) throw new Error("Produto não encontrado");
    return resp(await normalizeProduct(data));
  },

  async create(
    data: FormData | Partial<Product>,
  ): Promise<ServiceResponse<Product>> {
    const supabase = createClient();
    const pid = await getCurrentProjectId();
    let payload: Record<string, unknown> = {};
    const images: string[] = [];

    if (data instanceof FormData) {
      payload = {
        project_id: pid,
        name: (data.get("name") as string) || null,
        description: (data.get("description") as string) || null,
        purchase_price: data.get("purchase_price")
          ? parseFloat(
              String(data.get("purchase_price")!)
                .replace(/[^\d.,-]/g, "")
                .replace(",", "."),
            )
          : null,
        stock_quantity: data.get("stock_quantity")
          ? parseInt(String(data.get("stock_quantity")!), 10) || 0
          : 0,
        category: (data.get("category") as string) || null,
        category_id: (data.get("category_id") as string) || null,
      };
      for (const file of Array.from(
        data.getAll("images") as unknown as File[],
      )) {
        if (file && typeof file === "object" && "name" in file) {
          void file;
        }
      }
    } else {
      payload = {
        project_id: pid,
        name: data.name ?? null,
        description: data.description ?? null,
        purchase_price: data.purchase_price ?? null,
        stock_quantity: data.stock_quantity ?? 0,
        category: data.category ?? null,
        category_id: data.category_id ?? null,
      };
    }

    const { data: row, error } = await supabase
      .from("products")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;

    if (images.length > 0) {
      const { error: imgErr } = await supabase
        .from("product_images")
        .insert(
          images.map((url) => ({
            project_id: pid,
            product_id: row.id,
            image_url: url,
          })),
        );
      if (imgErr) throw imgErr;
    }
    return resp(await normalizeProduct(row));
  },

  async update(
    id: string,
    data: FormData | Partial<Product>,
  ): Promise<ServiceResponse<Product>> {
    const supabase = createClient();
    const pid = await getCurrentProjectId();
    const payload: Record<string, unknown> = {};
    if (data instanceof FormData) {
      const entries = Array.from(
        data.entries() as unknown as Iterable<[string, unknown]>,
      );
      for (const [k, v] of entries) {
        if (k === "images") continue;
        if (k === "purchase_price" && typeof v === "string") {
          payload.purchase_price =
            parseFloat(v.replace(/[^\d.,-]/g, "").replace(",", ".")) || null;
        } else if (k === "stock_quantity" && typeof v === "string") {
          payload.stock_quantity = parseInt(v, 10) || 0;
        } else if (typeof v === "string") {
          payload[k] = v || null;
        }
      }
    } else {
      if ("name" in data) payload.name = data.name ?? null;
      if ("description" in data) payload.description = data.description ?? null;
      if ("purchase_price" in data)
        payload.purchase_price = data.purchase_price ?? null;
      if ("stock_quantity" in data)
        payload.stock_quantity = data.stock_quantity ?? 0;
      if ("category" in data) payload.category = data.category ?? null;
      if ("category_id" in data) payload.category_id = data.category_id ?? null;
    }
    const { data: row, error } = await supabase
      .from("products")
      .update(payload as never)
      .eq("id", id)
      .eq("project_id", pid)
      .select()
      .single();
    if (error) throw error;
    return resp(await normalizeProduct(row));
  },

  async delete(id: string): Promise<ServiceResponse<void>> {
    const supabase = createClient();
    const pid = await getCurrentProjectId();
    const { error } = await supabase
      .from("products")
      .update({ is_active: false, deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("project_id", pid);
    if (error) throw error;
    return resp(undefined);
  },
};