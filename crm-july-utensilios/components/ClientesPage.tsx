"use client";

import { Search, UserPlus } from "lucide-react";
import KPICard from "./KPICard";

const clients = [
  { name: "Maria Silva", contact: "maria@email.com", value: "R$ 8.430", status: "Ativo", statusColor: "#008A4E" },
  { name: "Carlos Lima", contact: "(11) 99999-0000", value: "R$ 2.150", status: "Atenção", statusColor: "#B76B00" },
  { name: "Fernanda Souza", contact: "Endereço atualizado", value: "R$ 14.980", status: "Fiel", statusColor: "#2A2933" },
];

export default function ClientesPage() {
  return (
    <div className="clip rounded-[32px] bg-white p-8 flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[#2A2933] text-[28px] font-bold font-['Inter'] leading-tight">
            Clientes
          </h1>
          <p className="text-[#616167] text-sm font-normal font-['Inter']">
            Cadastro, histórico e status de relacionamento.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-[280px] h-12 bg-[#F8F6F4] rounded-full px-4 flex items-center gap-2">
            <Search className="w-[18px] h-[18px] text-[#939399]" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              className="flex-1 bg-transparent text-sm font-normal font-['Inter'] outline-none text-[#939399] placeholder:text-[#939399]"
            />
          </div>

          <button className="h-12 px-[18px] bg-[#FFDAD8] rounded-full flex items-center gap-2 hover:bg-[#FFC5C2] transition-colors">
            <UserPlus className="w-[18px] h-[18px] text-[#2A2933]" />
            <span className="text-[#2A2933] text-sm font-semibold font-['Inter']">
              Novo cliente
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Clientes ativos" value="1.248" note="+12 nesta semana" highlight />
        <KPICard label="CPFs validados" value="317" note="com máscara ativa" />
        <KPICard label="Em negociação" value="88" note="follow-up pendente" />
      </div>

      <div className="flex-1 bg-[#F8F6F4] rounded-[28px] p-6 flex flex-col gap-3 overflow-auto">
        <h2 className="text-[#2A2933] text-lg font-bold font-['Inter']">
          Histórico e status
        </h2>

        {clients.map((client, i) => (
          <div key={i} className="flex items-center justify-between bg-white rounded-xl p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[#2A2933] text-sm font-semibold font-['Inter']">
                {client.name}
              </span>
              <span className="text-[#616167] text-sm font-normal font-['Inter']">
                {client.contact}
              </span>
            </div>
            <span className="text-[#2A2933] text-sm font-semibold font-['Inter']">
              {client.value}
            </span>
            <span
              className="text-sm font-semibold font-['Inter']"
              style={{ color: client.statusColor }}
            >
              {client.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
