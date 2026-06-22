"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import KPICard from "@/components/KPICard";
import { dashboardService } from "@/lib/services";
import { DashboardSummary, OverdueInstallment } from "@/types";
import { formatCurrency, formatDate, getMonthName } from "@/lib/utils";

export default function FinanceiroPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [overdue, setOverdue] = useState<OverdueInstallment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, overdueRes] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getOverdue(),
        ]);
        setData(summaryRes.data);
        setOverdue(overdueRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
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

  const maxValue = data?.monthly
    ? Math.max(...data.monthly.map((m) => Math.max(parseFloat(m.revenue), parseFloat(m.profit))))
    : 0;

  const totalReceivable = overdue.reduce(
    (sum, o) => sum + parseFloat(String(o.amount)),
    0
  );

  return (
    <div className="clip rounded-[32px] bg-white p-8 flex flex-col gap-5 h-full overflow-hidden">
      <TopBar
        title="Financeiro"
        subtitle="Lucro real, inadimplência e fluxo de caixa mensal."
        showSearch={false}
        showNewSale={false}
      />

      <div className="grid grid-cols-3 gap-4">
        <KPICard
          label="Lucro real"
          value={formatCurrency(data?.real_profit)}
          note="31,7% de margem"
          highlight
        />
        <KPICard
          label="Parcelas em atraso"
          value={String(data?.overdue_count)}
          note={`${formatCurrency(totalReceivable)} em aberto`}
        />
        <KPICard
          label="Caixa disponível"
          value={formatCurrency(data?.total_revenue)}
          note="Faturamento total"
        />
      </div>

      <div className="flex-1 grid grid-cols-[1fr_340px] gap-4 min-h-0">
        <div className="bg-[#F8F6F4] rounded-[28px] p-6 flex flex-col gap-4 overflow-auto">
          <div className="flex items-center justify-between">
            <span className="text-[#2A2933] text-lg font-bold font-['Inter']">
              Faturamento x Lucro
            </span>
          </div>

          <div className="flex-1 flex items-end gap-4 px-4 pb-4">
            {data?.monthly.map((m, i) => {
              const revenueHeight = maxValue > 0 ? (parseFloat(m.revenue) / maxValue) * 100 : 0;
              const profitHeight = maxValue > 0 ? (parseFloat(m.profit) / maxValue) * 100 : 0;
              const isNegative = parseFloat(m.profit) < 0;

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center gap-1 h-[200px]">
                    <div
                      className="w-6 bg-[#FFDAD8] rounded-[14px] transition-all hover:opacity-80"
                      style={{ height: `${Math.max(revenueHeight, 5)}%` }}
                      title={`Faturamento: ${formatCurrency(m.revenue)}`}
                    />
                    <div
                      className={`w-6 rounded-[14px] transition-all hover:opacity-80 ${
                        isNegative ? "bg-[#C23A2E]" : "bg-[#008A4E]"
                      }`}
                      style={{ height: `${Math.max(Math.abs(profitHeight), 5)}%` }}
                      title={`Lucro: ${formatCurrency(m.profit)}`}
                    />
                  </div>
                  <span className="text-[#939399] text-xs font-semibold font-['Inter']">
                    {getMonthName(m.month)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#FFDAD8] rounded-full" />
              <span className="text-[#616167] text-xs">Faturamento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#008A4E] rounded-full" />
              <span className="text-[#616167] text-xs">Lucro</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[28px] p-6 flex flex-col gap-4 overflow-auto">
          <span className="text-[#2A2933] text-lg font-bold font-['Inter']">
            A receber
          </span>

          {overdue.length > 0 ? (
            <>
              <div className="p-4 bg-[#C23A2E]/10 rounded-xl">
                <span className="text-[#C23A2E] text-2xl font-bold">
                  {formatCurrency(totalReceivable)}
                </span>
                <p className="text-[#616167] text-sm mt-1">
                  {overdue.length} parcela(s) vencida(s)
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {overdue.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#F8F6F4] rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[#2A2933] text-sm font-medium">
                        {item.customer}
                      </span>
                      <span className="text-[#C23A2E] text-sm font-bold">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[#616167] text-xs">
                        Venceu: {formatDate(item.due_date)}
                      </span>
                      <span className="text-[#C23A2E] text-xs font-semibold">
                        {item.days_overdue} dia(s) atraso
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#616167]">
              <div className="text-center">
                <span className="text-2xl mb-2">🎉</span>
                <p className="text-sm">Nenhuma parcela em atraso!</p>
              </div>
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-[#E8E1DF]">
            <div className="flex items-center justify-between">
              <span className="text-[#939399] text-xs font-semibold">
                Taxa de inadimplência
              </span>
              <span className="text-[#C23A2E] text-sm font-bold">
                {data && parseFloat(data.total_revenue) > 0
                  ? ((totalReceivable / parseFloat(data.total_revenue)) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
