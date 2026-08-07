import { Installment, PaymentData } from "@/types";
import { createClient } from "../supabase/client";
import { getCurrentProjectId, resp, ServiceResponse, toNumber } from "./services";
import { saleService } from "./sales";


export const installmentService = {
      async getAll(): Promise<ServiceResponse<Installment[]>> {
        const all = await saleService.getAll();
        const ins: Installment[] = [];
        for (const sale of all.data) {
          for (const i of sale.installments) ins.push(i);
        }
        return resp(ins);
      },
    
      async pay(
        id: string,
        data: PaymentData,
      ): Promise<ServiceResponse<Installment>> {
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
        const { data: sale } = await supabase
          .from("sales")
          .select("customer_id")
          .eq("id", row.sale_id)
          .eq("project_id", pid)
          .single();
        const { data: client } = sale?.customer_id
          ? await supabase
              .from("clients")
              .select("name")
              .eq("id", sale.customer_id)
              .eq("project_id", pid)
              .single()
          : { data: null };
        return resp({
          ...row,
          sale: row.sale_id,
          is_overdue:
            row.status === "pending" &&
            new Date(row.due_date) < new Date(new Date().toDateString()),
          customer_name: client?.name ?? undefined,
        });
      },
    };