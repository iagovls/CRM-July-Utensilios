"use client";

export default function PerfilPage() {
  return (
    <div className="clip rounded-[32px] bg-white p-8 flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[#2A2933] text-[28px] font-bold font-['Inter'] leading-tight">
            Perfil de usuário
          </h1>
          <p className="text-[#616167] text-sm font-normal font-['Inter']">
            Dados de acesso, papel e preferências do sistema.
          </p>
        </div>
      </div>

      <div className="bg-[#F8F6F4] rounded-[28px] p-6 flex gap-5">
        <div className="w-[120px] h-[120px] bg-[#FFDAD8] rounded-[28px] flex items-center justify-center">
          <div className="w-16 h-16 bg-[#FFDAD8] rounded-full" />
        </div>

        <div className="flex-1 bg-white rounded-[24px] p-5 flex flex-col gap-3">
          <span className="text-[#2A2933] text-[13px] font-semibold font-['Inter']">
            Notificações e auditoria ativadas
          </span>
          <h2 className="text-[#2A2933] text-[22px] font-bold font-['Inter']">
            Ana Pereira
          </h2>
          <span className="text-[#616167] text-[13px] font-semibold font-['Inter']">
            Admin | acesso total ao CRM
          </span>
          <span className="text-[#616167] text-xs font-normal font-['Inter']">
            Último login há 2 min
          </span>
        </div>

        <div className="bg-white rounded-[24px] p-5 flex items-center">
          <span className="text-[#2A2933] text-[13px] font-semibold font-['Inter']">
            Acesso a financeiro: Admin
          </span>
        </div>
      </div>
    </div>
  );
}
