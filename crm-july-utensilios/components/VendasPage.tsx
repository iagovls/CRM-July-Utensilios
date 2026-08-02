"use client";

import KPICard from "./KPICard";

const sales = [
  { customer: "Maria Silva", product: "Kit cozinha", value: "R$ 1.280", status: "Paga", statusColor: "#008A4E" },
  { customer: "Carlos Lima", product: "Panela premium", value: "R$ 860", status: "Pendente", statusColor: "#B76B00" },
  { customer: "Fernanda Souza", product: "Jogo 12 peças", value: "R$ 2.150", status: "Cancelada", statusColor: "#C23A2E" },
];

export default function VendasPage() {
  return (
    <div className="clip rounded-[32px] bg-white p-8 flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[#2A2933] text-[28px] font-bold font-['Inter'] leading-tight">
            Vendas
          </h1>
          <p className="text-[#616167] text-sm font-normal font-['Inter']">
            Registro de pedidos, parcelas e status de pagamento.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Pedidos ativos" value="128" note="agendados hoje" highlight />
        <KPICard label="Parcelas em atraso" value="23" note="precisam de baixa" />
        <KPICard label="Faturamento do mês" value="R$ 84,3 mil" note="+18% sobre o mês anterior" />
      </div>

      <div className="flex-1 bg-[#F8F6F4] rounded-[28px] p-6 flex flex-col gap-3 overflow-auto">
        <h2 className="text-[#2A2933] text-lg font-bold font-['Inter']">
          Últimas vendas
        </h2>

        {sales.map((sale, i) => (
          <div key={i} className="flex items-center justify-between bg-white rounded-xl p-4">
            <span className="text-[#2A2933] text-sm font-semibold font-['Inter']">
              {sale.customer}
            </span>
            <span className="text-[#616167] text-sm font-normal font-['Inter']">
              {sale.product}
            </span>
            <span className="text-[#2A2933] text-sm font-semibold font-['Inter']">
              {sale.value}
            </span>
            <span
              className="text-sm font-semibold font-['Inter']"
              style={{ color: sale.statusColor }}
            >
              {sale.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
