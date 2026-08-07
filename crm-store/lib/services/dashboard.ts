import { DashboardSummary, OverdueInstallment } from "@/types";
import { resp, ServiceResponse, toMonthKey, toNumber } from "./services";
import { saleService } from "./sales";

export const dashboardService = {
  async getSummary(_params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<ServiceResponse<DashboardSummary>> {
    const allSales = await saleService.getAll();
    let sales = allSales.data.filter((s) => s.status !== "canceled");
    if (_params?.start_date) {
      sales = sales.filter((s) => s.created_at >= _params.start_date!);
    }
    if (_params?.end_date) {
      sales = sales.filter((s) => s.created_at <= _params.end_date!);
    }

    const total_revenue = sales.reduce(
      (sum, s) => sum + toNumber(s.total_amount),
      0,
    );
    const total_cost = sales.reduce(
      (sum, s) => sum + toNumber(s.total_cost),
      0,
    );
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
          const days_overdue = Math.max(
            0,
            Math.floor((today - due) / 86400000),
          );
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
