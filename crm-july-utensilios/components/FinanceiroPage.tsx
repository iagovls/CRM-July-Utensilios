"use client";

import KPICard from "./KPICard";

export default function FinanceiroPage() {
  return (
    <div className="clip rounded-[32px] bg-white p-8 flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[#2A2933] text-[28px] font-bold font-['Inter'] leading-tight">
            Financeiro
          </h1>
          <p className="text-[#616167] text-sm font-normal font-['Inter']">
            Lucro real, inadimplência e fluxo de caixa mensal.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Lucro real" value="R$ 26,8 mil" note="31,7% de margem" highlight />
        <KPICard label="Vencem hoje" value="7" note="alerta de cobrança" />
        <KPICard label="Caixa disponível" value="R$ 18,4 mil" note="atualizado agora" />
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-4 flex-1 min-h-0">
        <div className="bg-[#F8F6F4] rounded-[28px] p-6 flex flex-col gap-3">
          <div className="flex items-end gap-3 flex-1">
            <div className="w-9 h-[92px] bg-[#FFDAD8] rounded-[14px]" />
            <div className="w-9 h-[148px] bg-[#F6BDB7] rounded-[14px]" />
            <div className="w-9 h-[120px] bg-[#FFDAD8] rounded-[14px]" />
            <div className="w-9 h-[176px] bg-[#F08D85] rounded-[14px]" />
            <div className="w-9 h-[154px] bg-[#FFDAD8] rounded-[14px]" />
          </div>
          <div className="flex gap-3">
            <span className="text-[#939399] text-xs font-semibold font-['Inter']">Jan</span>
            <span className="text-[#939399] text-xs font-semibold font-['Inter']">Fev</span>
            <span className="text-[#939399] text-xs font-semibold font-['Inter']">Mar</span>
            <span className="text-[#939399] text-xs font-semibold font-['Inter']">Abr</span>
            <span className="text-[#939399] text-xs font-semibold font-['Inter']">Mai</span>
          </div>
        </div>

        <div className="bg-white rounded-[28px] p-6 flex flex-col gap-3">
          <span className="text-[#2A2933] text-base font-bold font-['Inter']">
            A receber
          </span>
          <span className="text-[#2A2933] text-2xl font-bold font-['Inter']">
            R$ 12.480
          </span>
          <span className="text-[#616167] text-[13px] font-normal font-['Inter']">
            Baixa rápida em 4 parcelas
          </span>

          <div className="flex flex-col gap-2 pt-2 border-t border-[#E8E1DF]">
            <span className="text-[#2A2933] text-[13px] font-semibold font-['Inter']">
              Parcelas vencidas: 7 hoje
            </span>
            <span className="text-[#2A2933] text-[13px] font-semibold font-['Inter']">
              Clientes inadimplentes: 4
            </span>
            <span className="text-[#2A2933] text-[13px] font-semibold font-['Inter']">
              Venda média: R$ 640
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
