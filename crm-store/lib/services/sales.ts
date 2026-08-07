import { Sale, SaleFormData } from "@/types";
import { createClient } from "../supabase/client";
import { getCurrentProjectId, resp, ServiceResponse, toNumber } from "./services";
import { Tables } from "@/types/supabase";


async function normalizeSale(
  row: Tables<"sales">,
  ctx: {
    clientsMap: Map<string, Tables<"clients">>;
    itemsById: Map<string, Tables<"sale_items">[]>;
    installmentsById: Map<string, Tables<"installments">[]>;
    productsMap: Map<string, Tables<"products">>;
  },
): Promise<Sale> {
  const items = (ctx.itemsById.get(row.id) ?? []).map((i) => ({
    ...i,
    product: i.product_id,
    product_name:
      ctx.productsMap.get(i.product_id)?.name ??
      `Produto ${i.product_id.slice(0, 6)}`,
  }));
  const installments = (ctx.installmentsById.get(row.id) ?? []).map((ins) => ({
    ...ins,
    sale: ins.sale_id,
    is_overdue:
      ins.status === "pending" &&
      new Date(ins.due_date) < new Date(new Date().toDateString()),
    customer_name: row.customer_id
      ? (ctx.clientsMap.get(row.customer_id)?.name ?? undefined)
      : undefined,
  }));
  const customer = ctx.clientsMap.get(row.customer_id ?? "");
  const totalCost = items.reduce(
    (sum, i) => sum + toNumber(i.purchase_price) * toNumber(i.quantity),
    0,
  );
  const totalAmount = items.reduce(
    (sum, i) => sum + toNumber(i.sale_price) * toNumber(i.quantity),
    toNumber(row.total_amount),
  );
  return {
    ...row,
    customer: row.customer_id,
    customer_name: customer ? (customer.name ?? null) : null,
    profit: String(totalAmount - totalCost),
    items,
    installments,
  };
}

export const saleService = {
  async getAll(): Promise<ServiceResponse<Sale[]>> {
    const supabase = createClient();
    const pid = await getCurrentProjectId();
    const [salesRes, clientsRes, itemsRes, insRes, productsRes] =
      await Promise.all([
        supabase
          .from("sales")
          .select("*")
          .eq("project_id", pid)
          .order("created_at", { ascending: false }),
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
    const result = await Promise.all(
      (salesRes.data ?? []).map((s) => normalizeSale(s, ctx)),
    );
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
      project_id: string,
    ] = [
      (data.customer as string | undefined) ?? null,
      data.first_due_date,
      data.installments_count,
      JSON.stringify(data.items),
      data.is_paid ?? false,
      (data.payment_method as string) ?? "other",
      pid,
    ];
    const { data: saleId, error: rpcErr } = await supabase.rpc(
      "create_sale_with_items",
      {
        p_customer_id: rpcArgs[0],
        p_first_due_date: rpcArgs[1],
        p_installments_count: rpcArgs[2],
        p_items: rpcArgs[3],
        p_is_paid: rpcArgs[4],
        p_payment_method: rpcArgs[5],
        p_project_id: rpcArgs[6],
      },
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
