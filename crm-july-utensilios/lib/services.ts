"use client";

import { createClient } from "@/lib/supabase/client";
import {
  Client,
  Product,
  Sale,
  Installment,
  Category,
  DashboardSummary,
  OverdueInstallment,
  PurchaseHistory,
  SaleFormData,
  PaymentData,
} from "@/types";
import type { Tables } from "@/types/supabase";

export const PROJECT_SLUG = process.env.NEXT_PUBLIC_PROJECT_SLUG ?? "july-utensilios";

let _cachedProjectId: string | null = null;
async function getCurrentProjectId(): Promise<string> {
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
      `Projeto com slug "${PROJECT_SLUG}" não encontrado. Verifique NEXT_PUBLIC_PROJECT_SLUG.`
    );
  }
  _cachedProjectId = data.id;
  return data.id;
}

interface ServiceResponse<T> {
  data: T;
}

function resp<T>(data: T): ServiceResponse<T> {
  return { data };
}

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return 0;
  return n;
}

function toMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "0000-00";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// ---------- Clients ----------

async function buildPurchaseHistory(customerId: string): Promise<PurchaseHistory[]> {
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

async function normalizeClient(row: Tables<"clients">): Promise<Client> {
  return {
    ...row,
    purchase_history: await buildPurchaseHistory(row.id),
  };
}

// ---------- Products ----------

async function normalizeProduct(row: Tables<"products">): Promise<Product> {
  const supabase = createClient();
  const pid = await getCurrentProjectId();
  const [imgRes, movRes] = await Promise.all([
    supabase.from("product_images").select("*").eq("product_id", row.id).eq("project_id", pid),
    supabase
      .from("stock_movements")
      .select("id, product_id, project_id, movement_type, quantity, notes, created_at, updated_at, actor_id")
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

// ---------- Sales ----------

async function normalizeSale(row: Tables<"sales">, ctx: {
  clientsMap: Map<string, Tables<"clients">>;
  itemsById: Map<string, Tables<"sale_items">[]>;
  installmentsById: Map<string, Tables<"installments">[]>;
  productsMap: Map<string, Tables<"products">>;
}): Promise<Sale> {
  const items = (ctx.itemsById.get(row.id) ?? []).map((i) => ({
    ...i,
    product: i.product_id,
    product_name: ctx.productsMap.get(i.product_id)?.name ?? `Produto ${i.product_id.slice(0, 6)}`,
  }));
  const installments = (ctx.installmentsById.get(row.id) ?? []).map((ins) => ({
    ...ins,
    sale: ins.sale_id,
    is_overdue:
      ins.status === "pending" && new Date(ins.due_date) < new Date(new Date().toDateString()),
    customer_name: row.customer_id ? ctx.clientsMap.get(row.customer_id)?.name ?? undefined : undefined,
  }));
  const customer = ctx.clientsMap.get(row.customer_id ?? "");
  const totalCost = items.reduce(
    (sum, i) => sum + toNumber(i.purchase_price) * toNumber(i.quantity),
    0
  );
  const totalAmount = items.reduce(
    (sum, i) => sum + toNumber(i.sale_price) * toNumber(i.quantity),
    toNumber(row.total_amount)
  );
  return {
    ...row,
    customer: row.customer_id,
    customer_name: customer ? customer.name ?? null : null,
    profit: String(totalAmount - totalCost),
    items,
    installments,
  };
}

// =============================================================
// Public API (mantida mesma assinatura do axios original: { data: T })
// =============================================================

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
    const normalized = await Promise.all((data ?? []).map(normalizeClient));
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

  async update(id: string, data: Partial<Client>): Promise<ServiceResponse<Client>> {
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

  async create(data: FormData | Partial<Product>): Promise<ServiceResponse<Product>> {
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
          ? parseFloat(String(data.get("purchase_price")!).replace(/[^\d.,-]/g, "").replace(",", "."))
          : null,
        stock_quantity: data.get("stock_quantity")
          ? parseInt(String(data.get("stock_quantity")!), 10) || 0
          : 0,
        category: (data.get("category") as string) || null,
        category_id: (data.get("category_id") as string) || null,
      };
      for (const file of Array.from(data.getAll("images") as unknown as File[])) {
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
        .insert(images.map((url) => ({ project_id: pid, product_id: row.id, image_url: url })));
      if (imgErr) throw imgErr;
    }
    return resp(await normalizeProduct(row));
  },

  async update(id: string, data: FormData | Partial<Product>): Promise<ServiceResponse<Product>> {
    const supabase = createClient();
    const pid = await getCurrentProjectId();
    const payload: Record<string, unknown> = {};
    if (data instanceof FormData) {
      const entries = Array.from(data.entries() as unknown as Iterable<[string, unknown]>);
      for (const [k, v] of entries) {
        if (k === "images") continue;
        if (k === "purchase_price" && typeof v === "string") {
          payload.purchase_price = parseFloat(v.replace(/[^\d.,-]/g, "").replace(",", ".")) || null;
        } else if (k === "stock_quantity" && typeof v === "string") {
          payload.stock_quantity = parseInt(v, 10) || 0;
        } else if (typeof v === "string") {
          payload[k] = v || null;
        }
      }
    } else {
      if ("name" in data) payload.name = data.name ?? null;
      if ("description" in data) payload.description = data.description ?? null;
      if ("purchase_price" in data) payload.purchase_price = data.purchase_price ?? null;
      if ("stock_quantity" in data) payload.stock_quantity = data.stock_quantity ?? 0;
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

export const saleService = {
  async getAll(): Promise<ServiceResponse<Sale[]>> {
    const supabase = createClient();
    const pid = await getCurrentProjectId();
    const [salesRes, clientsRes, itemsRes, insRes, productsRes] = await Promise.all([
      supabase.from("sales").select("*").eq("project_id", pid).order("created_at", { ascending: false }),
      supabase.from("clients").select("*").eq("project_id", pid),
      supabase.from("sale_items").select("*").eq("project_id", pid),
      supabase.from("installments").select("*").eq("project_id", pid),
      supabase.from("products").select("*").eq("project_id", pid),
    ]);
    if (salesRes.error) throw salesRes.error;

    const clientsMap = new Map<string, Tables<"clients">>();
    for (const c of clientsRes.data ?? []) clientsMap.set(c.id, c);

    const itemsById = new Map<string, Tables<"sale_items">[]>();
    for (const it of itemsRes.data ?? []) {
      const list = itemsById.get(it.sale_id) ?? [];
      list.push(it);
      itemsById.set(it.sale_id, list);
    }
    const installmentsById = new Map<string, Tables<"installments">[]>();
    for (const ins of insRes.data ?? []) {
      const list = installmentsById.get(ins.sale_id) ?? [];
      list.push(ins);
      installmentsById.set(ins.sale_id, list);
    }
    const productsMap = new Map<string, Tables<"products">>();
    for (const p of productsRes.data ?? []) productsMap.set(p.id, p);

    const ctx = { clientsMap, itemsById, installmentsById, productsMap };
    const result = await Promise.all((salesRes.data ?? []).map((s) => normalizeSale(s, ctx)));
    return resp(result);
  },

  async getById(id: string): Promise<ServiceResponse<Sale>> {
    const all = await this.getAll();
    const found = all.data.find((s) => s.id === id);
    if (!found) throw new Error("Venda não encontrada");
    return resp(found);
  },

  async create(data: SaleFormData): Promise<ServiceResponse<Sale>> {
    const supabase = createClient();
    const pid = await getCurrentProjectId();
    const rpcArgs: [
      uuid: string | null,
      date: string,
      integer: number,
      text: string,
      boolean: boolean,
      payment_method: string,
      project_id: string
    ] = [
      (data.customer as string | undefined) ?? null,
      data.first_due_date,
      data.installments_count,
      JSON.stringify(data.items),
      data.is_paid ?? false,
      (data.payment_method as string) ?? "other",
      pid,
    ];
    const rpcFn = supabase.rpc as unknown as (
      fn: string,
      args?: Record<string, unknown>
    ) => Promise<{ data: unknown; error: unknown }>;
    const { data: saleId, error: rpcErr } = await rpcFn(
      "create_sale_with_items",
      {
        p_customer_id: rpcArgs[0],
        p_first_due_date: rpcArgs[1],
        p_installments_count: rpcArgs[2],
        p_items: rpcArgs[3],
        p_is_paid: rpcArgs[4],
        p_payment_method: rpcArgs[5],
        p_project_id: rpcArgs[6],
      }
    );
    if (rpcErr) throw rpcErr;
    if (!saleId) throw new Error("Venda não foi criada (sem retorno do RPC)");
    const created = await saleService.getById(String(saleId));
    return created;
  },

  async cancel(id: string): Promise<ServiceResponse<void>> {
    const supabase = createClient();
    const pid = await getCurrentProjectId();
    const { error } = await supabase
      .from("sales")
      .update({ status: "canceled" })
      .eq("id", id)
      .eq("project_id", pid);
    if (error) throw error;
    return resp(undefined);
  },
};

export const installmentService = {
  async getAll(): Promise<ServiceResponse<Installment[]>> {
    const all = await saleService.getAll();
    const ins: Installment[] = [];
    for (const sale of all.data) {
      for (const i of sale.installments) ins.push(i);
    }
    return resp(ins);
  },

  async pay(id: string, data: PaymentData): Promise<ServiceResponse<Installment>> {
    const supabase = createClient();
    const pid = await getCurrentProjectId();
    const { data: row, error } = await supabase
      .from("installments")
      .update({
        status: "paid",
        paid_amount: toNumber(data.amount_paid),
        paid_at: new Date().toISOString(),
        payment_method: data.payment_method,
      })
      .eq("id", id)
      .eq("project_id", pid)
      .select()
      .single();
    if (error) throw error;
    const { data: sale } = await supabase.from("sales").select("customer_id").eq("id", row.sale_id).eq("project_id", pid).single();
    const { data: client } = sale?.customer_id
      ? await supabase.from("clients").select("name").eq("id", sale.customer_id).eq("project_id", pid).single()
      : { data: null };
    return resp({
      ...row,
      sale: row.sale_id,
      is_overdue: row.status === "pending" && new Date(row.due_date) < new Date(new Date().toDateString()),
      customer_name: client?.name ?? undefined,
    });
  },
};

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

  async update(id: string, data: { name: string }): Promise<ServiceResponse<Category>> {
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

export const dashboardService = {
  async getSummary(_params?: { start_date?: string; end_date?: string }): Promise<ServiceResponse<DashboardSummary>> {
    const allSales = await saleService.getAll();
    let sales = allSales.data.filter((s) => s.status !== "canceled");
    if (_params?.start_date) {
      sales = sales.filter((s) => s.created_at >= _params.start_date!);
    }
    if (_params?.end_date) {
      sales = sales.filter((s) => s.created_at <= _params.end_date!);
    }

    const total_revenue = sales.reduce((sum, s) => sum + toNumber(s.total_amount), 0);
    const total_cost = sales.reduce((sum, s) => sum + toNumber(s.total_cost), 0);
    const real_profit = total_revenue - total_cost;

    const monthlyMap = new Map<string, { revenue: number; profit: number }>();
    for (const s of sales) {
      const key = toMonthKey(s.created_at);
      const curr = monthlyMap.get(key) ?? { revenue: 0, profit: 0 };
      curr.revenue += toNumber(s.total_amount);
      curr.profit += toNumber(s.profit);
      monthlyMap.set(key, curr);
    }
    const monthly = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({
        month,
        revenue: v.revenue.toFixed(2),
        profit: v.profit.toFixed(2),
      }));

    let overdue_count = 0;
    for (const s of sales) {
      for (const i of s.installments) {
        if (i.is_overdue) overdue_count++;
      }
    }

    return resp({
      total_revenue: total_revenue.toFixed(2),
      total_cost: total_cost.toFixed(2),
      real_profit: real_profit.toFixed(2),
      monthly,
      overdue_count,
    });
  },

  async getOverdue(): Promise<ServiceResponse<OverdueInstallment[]>> {
    const sales = await saleService.getAll();
    const result: OverdueInstallment[] = [];
    const today = new Date(new Date().toDateString()).getTime();
    for (const sale of sales.data) {
      for (const ins of sale.installments) {
        if (ins.status === "paid") continue;
        const due = new Date(new Date(ins.due_date).toDateString()).getTime();
        if (due < today) {
          const days_overdue = Math.max(0, Math.floor((today - due) / 86400000));
          result.push({
            id: ins.id,
            sale_id: sale.id,
            customer: sale.customer_name ?? "Sem nome",
            amount: String(ins.amount),
            due_date: ins.due_date,
            days_overdue,
          });
        }
      }
    }
    return resp(result);
  },
};
