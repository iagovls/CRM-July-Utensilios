"use client";

import { Eye, History } from "lucide-react";
import { Installment, Sale } from "@/types";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

export type SalesTabKey = "vendas" | "parcelas" | "historico";

interface SalesTabsProps {
  activeTab: SalesTabKey;
  onTabChange: (tab: SalesTabKey) => void;
  loading: boolean;
  sales: Sale[];
  installments: Installment[];
  searchQuery?: string;
  onViewSale?: (sale: Sale) => void;
  onClickInstallment?: (installment: Installment) => void;
}

export default function SalesTabs({
  activeTab,
  onTabChange,
  loading,
  sales,
  installments,
  searchQuery = "",
  onViewSale,
  onClickInstallment,
}: SalesTabsProps) {
  const q = searchQuery.toLowerCase().trim();

  const filteredBySearch = (list: Sale[]) =>
    q
      ? list.filter(
          (s) =>
            s.customer_name?.toLowerCase().includes(q) ||
            String(s.id).includes(q),
        )
      : list;

  const pendingSales = filteredBySearch(
    sales.filter((s) => s.status === "pending"),
  );
  const finishedSales = filteredBySearch(
    sales.filter((s) => s.status !== "pending"),
  );
  const pendingInstallments = installments.filter((i) => i.status === "pending");

  const tabButton = (
    key: SalesTabKey,
    label: React.ReactNode,
    badge?: number | null,
  ) => (
    <button
      onClick={() => onTabChange(key)}
      className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
        activeTab === key
          ? "bg-[#FFDAD8] text-[#2A2933]"
          : "text-[#616167] hover:bg-[#F8F6F4]"
      }`}
    >
      {label}
      {badge ? (
        <span className="ml-2 bg-[#C23A2E] text-white text-xs px-2 py-0.5 rounded-full">
          {badge}
        </span>
      ) : null}
    </button>
  );

  return (
    <>
      <div className="flex gap-2 border-b border-[#E8E1DF] pb-2 overflow-x-auto">
        {tabButton("vendas", "Vendas")}
        {tabButton(
          "parcelas",
          "Parcelas em aberto",
          pendingInstallments.length > 0 ? pendingInstallments.length : null,
        )}
        {tabButton(
          "historico",
          <>
            <History className="w-4 h-4 inline mr-1" />
            Histórico
          </>,
        )}
      </div>

      <div className="flex-1 bg-[#F8F6F4] rounded-[28px] p-4 md:p-6 flex flex-col gap-4 overflow-auto">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[#616167]">
            Carregando...
          </div>
        ) : activeTab === "vendas" ? (
          <SalesPendingList
            sales={pendingSales}
            onView={onViewSale}
          />
        ) : activeTab === "parcelas" ? (
          <InstallmentsList
            installments={pendingInstallments}
            onClick={onClickInstallment}
          />
        ) : (
          <SalesHistoryList
            sales={finishedSales}
            onView={onViewSale}
          />
        )}
      </div>
    </>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex items-center justify-center text-[#616167]">
      {children}
    </div>
  );
}

function SaleCard({
  sale,
  onView,
  showCreatedAt = false,
}: {
  sale: Sale;
  onView?: (sale: Sale) => void;
  showCreatedAt?: boolean;
}) {
  const statusLabel =
    sale.status === "paid"
      ? "Paga"
      : sale.status === "pending"
        ? "Pendente"
        : "Cancelada";

  return (
    <div
      onClick={() => onView?.(sale)}
      className="flex items-center justify-between bg-white rounded-xl p-4 hover:shadow-sm transition-shadow cursor-pointer"
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-[#2A2933] text-sm font-semibold font-['Inter']">
          #{sale.id} - {sale.customer_name || "Sem cliente"}
        </span>
        <span className="text-[#616167] text-xs font-normal">
          {showCreatedAt ? (
            <>
              {formatDate(sale.created_at)} •{" "}
            </>
          ) : null}
          {sale.items.length === 1
            ? sale.items[0].product_name
            : `${sale.items[0].product_name} + ${sale.items.length - 1} outro(s)`}{" "}
          • {sale.items.length} item(s) • {sale.installments_count}x
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span
          className={
            showCreatedAt
              ? "text-[#2A2933] font-bold"
              : "text-[#2A2933] text-lg font-bold font-['Inter']"
          }
        >
          {formatCurrency(sale.total_amount)}
        </span>
        <span
          className="text-sm font-semibold font-['Inter'] px-2 py-1 rounded-full"
          style={{
            color: "white",
            backgroundColor: getStatusColor(sale.status),
          }}
        >
          {statusLabel}
        </span>
        <Eye className="w-5 h-5 text-[#939399]" />
      </div>
    </div>
  );
}

function SalesPendingList({
  sales,
  onView,
}: {
  sales: Sale[];
  onView?: (sale: Sale) => void;
}) {
  return (
    <>
      <h2 className="text-[#2A2933] text-lg font-bold font-['Inter']">
        Vendas pendentes
      </h2>
      {sales.length === 0 ? (
        <EmptyState>Nenhuma venda pendente.</EmptyState>
      ) : (
        sales.map((sale) => (
          <SaleCard key={sale.id} sale={sale} onView={onView} />
        ))
      )}
    </>
  );
}

function SalesHistoryList({
  sales,
  onView,
}: {
  sales: Sale[];
  onView?: (sale: Sale) => void;
}) {
  return (
    <>
      <h2 className="text-[#2A2933] text-lg font-bold font-['Inter']">
        Histórico de vendas finalizadas
      </h2>
      {sales.length === 0 ? (
        <EmptyState>Nenhum registro encontrado.</EmptyState>
      ) : (
        <div className="flex flex-col gap-3 overflow-auto">
          {sales.map((sale) => (
            <SaleCard
              key={sale.id}
              sale={sale}
              onView={onView}
              showCreatedAt
            />
          ))}
        </div>
      )}
    </>
  );
}

function InstallmentsList({
  installments,
  onClick,
}: {
  installments: Installment[];
  onClick?: (i: Installment) => void;
}) {
  return (
    <>
      <h2 className="text-[#2A2933] text-lg font-bold font-['Inter']">
        Parcelas em aberto
      </h2>
      {installments.length === 0 ? (
        <EmptyState>Nenhuma parcela em aberto! 🎉</EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {installments.map((inst) => (
            <div
              key={inst.id}
              onClick={() => onClick?.(inst)}
              className={`bg-white rounded-xl p-4 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${
                inst.is_overdue
                  ? "border-l-4 border-[#C23A2E]"
                  : "border-l-4 border-[#008A4E]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[#2A2933] text-sm font-semibold">
                  {inst.customer_name || "Sem cliente"}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{
                    color: getStatusColor(
                      inst.is_overdue ? "canceled" : inst.status,
                    ),
                  }}
                >
                  {formatCurrency(inst.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[#616167] text-xs font-medium">
                  #{inst.number} - Venda {inst.sale}
                </span>
                {inst.is_overdue ? (
                  <span className="text-[#C23A2E] text-[10px] font-bold uppercase tracking-wider">
                    Em atraso
                  </span>
                ) : (
                  <span className="text-[#939399] text-[10px] font-bold uppercase tracking-wider">
                    Pendente
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F8F6F4]">
                <span className="text-[#616167] text-xs">
                  Venc: {formatDate(inst.due_date)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export type { SalesTabsProps };
