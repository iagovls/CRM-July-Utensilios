"use client";

import { useEffect, useState } from "react";
import KPICard from "@/components/KPICard";
import { dashboardService } from "@/lib/services";
import { DashboardSummary } from "@/types";
import { formatCurrency, getMonthName } from "@/lib/utils";
import { TrendingUp, DollarSign } from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await dashboardService.getSummary();
        setData(response.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-[#616167]">Carregando...</div>
      </div>
    );
  }

  const maxRevenue = data?.monthly
    ? Math.max(...data.monthly.map((m) => parseFloat(m.revenue)))
    : 0;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          label="Faturamento total"
          value={formatCurrency(data?.total_revenue)}
          note="Receita bruta"
          highlight
        />
        <KPICard
          label="Custo total"
          value={formatCurrency(data?.total_cost)}
          note="Custo dos produtos"
        />
        <KPICard
          label="Lucro real"
          value={formatCurrency(data?.real_profit)}
          note="Lucro = Faturamento - Custo"
        />
        <KPICard
          label="Parcelas em atraso"
          value={String(data?.overdue_count || 0)}
          note="Clientes inadimplentes"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="bg-white rounded-[28px] p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#2A2933]" />
              <span className="text-[#2A2933] text-lg font-bold font-['Inter']">
                Faturamento mensal
              </span>
            </div>
            <span className="px-3 py-2 bg-[#F8F6F4] rounded-full text-[#2A2933] text-sm font-semibold font-['Inter']">
              Jan - Jun
            </span>
          </div>
          <div className="flex-1 flex items-end gap-3 px-4 pb-4">
            {data?.monthly.map((m, i) => {
              const height = maxRevenue > 0 ? (parseFloat(m.revenue) / maxRevenue) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-[#FFDAD8] rounded-full transition-all hover:bg-[#FFC5C2]"
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`${getMonthName(m.month)}: ${formatCurrency(m.revenue)}`}
                  />
                  <span className="text-[#939399] text-xs font-semibold font-['Inter']">
                    {getMonthName(m.month)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-[28px] p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#2A2933]" />
              <span className="text-[#2A2933] text-lg font-bold font-['Inter']">
                Lucro mensal
              </span>
            </div>
          </div>
          <div className="flex-1 flex items-end gap-3 px-4 pb-4">
            {data?.monthly.map((m, i) => {
              const height = maxRevenue > 0 ? (parseFloat(m.profit) / maxRevenue) * 100 : 0;
              const isNegative = parseFloat(m.profit) < 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className={`w-full rounded-full transition-all hover:opacity-80 ${
                      isNegative ? "bg-[#C23A2E]" : "bg-[#008A4E]"
                    }`}
                    style={{ height: `${Math.max(Math.abs(height), 5)}%` }}
                    title={`${getMonthName(m.month)}: ${formatCurrency(m.profit)}`}
                  />
                  <span className="text-[#939399] text-xs font-semibold font-['Inter']">
                    {getMonthName(m.month)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
