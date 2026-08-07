import { Shield } from "lucide-react";
import TopBar from "@/components/TopBar";
import { getUserClaims, getDisplayName } from "@/lib/auth";

export default async function PerfilPage() {
  const claims = await getUserClaims();
  const displayName = getDisplayName(claims, "Usuário");
  const email = claims?.email;
  const emailPrefix = email?.split("@")[0] ?? "user";
  const username =
    claims?.user_metadata?.username || emailPrefix;

  const nameParts = displayName.split(" ");
  const first_name = nameParts[0] ?? displayName;
  const last_name = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

  const initial = (first_name?.[0] || username?.[0] || "?").toUpperCase();

  const role = claims?.role;
  const is_admin_role =
    role === "service_role" ||
    role === "admin" ||
    role === "supabase_admin";

  const userId = claims?.sub;

  return (
    <div className="clip rounded-[32px] bg-white p-4 md:p-8 flex flex-col gap-5 h-full overflow-hidden">
      <TopBar
        title="Perfil de usuário"
        subtitle="Dados de acesso, papel e preferências do sistema."
        showSearch={false}
      />

      <div className="flex-1 flex flex-col gap-4 md:gap-5 overflow-auto">
        <div className="relative bg-gradient-to-br from-[#FFDAD8] via-[#FFE9E7] to-[#FFF4F2] rounded-[28px] p-5 md:p-8 overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/40 blur-2xl pointer-events-none" />
          <div className="absolute -left-8 bottom-0 w-32 h-32 rounded-full bg-white/30 blur-2xl pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="shrink-0 w-[112px] h-[112px] md:w-[128px] md:h-[128px] bg-white rounded-[28px] shadow-sm flex items-center justify-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#FFDAD8] to-[#FFC5C2] flex items-center justify-center text-[#2A2933] text-2xl md:text-3xl font-bold shadow-inner">
                  {initial}
                </div>
              </div>

              <div className="flex flex-col items-center sm:items-start gap-3">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#008A4E] rounded-full text-white text-xs font-semibold">
                    <Shield className="w-3 h-3" />
                    Auditoria ativada
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                      is_admin_role
                        ? "bg-white text-[#2A2933]"
                        : "bg-white/70 text-[#616167]"
                    }`}
                  >
                    {is_admin_role ? "Admin · acesso total" : "Usuário · acesso limitado"}
                  </span>
                </div>

                <div className="text-center sm:text-left">
                  <h2 className="text-[#2A2933] text-xl md:text-2xl lg:text-[28px] font-bold leading-tight">
                    {first_name && last_name
                      ? `${first_name} ${last_name}`
                      : displayName}
                  </h2>
                  <p className="text-[#616167] text-sm font-medium mt-1">
                    @{username}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:ml-auto w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-3">
              <div className="flex flex-col items-stretch sm:items-end gap-1 text-left sm:text-right lg:text-right">
                <span className="text-[#2A2933] text-sm font-semibold">
                  Acesso seguro
                </span>
                <span className="text-[#616167] text-xs">
                  Recomendamos atualizar sua senha periodicamente.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-[24px] p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-[#2A2933] text-base md:text-lg font-bold">
                  Dados da conta
                </h3>
                <p className="text-[#939399] text-xs md:text-sm mt-0.5">
                  Informações de acesso e identificação no CRM.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#F8F6F4] rounded-2xl p-4 flex flex-col gap-1.5">
                <span className="text-[#939399] text-xs font-semibold uppercase tracking-wide">
                  E-mail
                </span>
                <span className="text-[#2A2933] text-sm font-medium break-all">
                  {email || "-"}
                </span>
              </div>

              <div className="bg-[#F8F6F4] rounded-2xl p-4 flex flex-col gap-1.5">
                <span className="text-[#939399] text-xs font-semibold uppercase tracking-wide">
                  Status
                </span>
                <span
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#008A4E]"
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-[#008A4E]" />
                  Conta ativa
                </span>
              </div>

              <div className="bg-[#F8F6F4] rounded-2xl p-4 flex flex-col gap-1.5">
                <span className="text-[#939399] text-xs font-semibold uppercase tracking-wide">
                  Papel
                </span>
                <span className="text-[#2A2933] text-sm font-medium capitalize">
                  {role || "user"}
                </span>
              </div>

              <div className="bg-[#F8F6F4] rounded-2xl p-4 flex flex-col gap-1.5">
                <span className="text-[#939399] text-xs font-semibold uppercase tracking-wide">
                  Provedor
                </span>
                <span className="text-[#2A2933] text-sm font-medium capitalize">
                  {claims?.app_metadata?.provider || "email"}
                </span>
              </div>

              <div className="bg-[#F8F6F4] rounded-2xl p-4 flex flex-col gap-1.5 md:col-span-2">
                <span className="text-[#939399] text-xs font-semibold uppercase tracking-wide">
                  ID do usuário
                </span>
                <span className="text-[#2A2933] text-xs font-mono break-all">
                  #{userId || "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-5 md:p-6 shadow-sm flex flex-col gap-4">
            <div>
              <h3 className="text-[#2A2933] text-base md:text-lg font-bold">
                Segurança
              </h3>
              <p className="text-[#939399] text-xs md:text-sm mt-0.5">
                Mantenha sua senha forte e atualizada.
              </p>
            </div>

            <ul className="space-y-3 text-sm text-[#616167]">
              <li className="flex gap-2">
                <span className="text-[#008A4E] font-bold">·</span>
                <span>Use pelo menos 8 caracteres com números e símbolos.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#008A4E] font-bold">·</span>
                <span>Não reutilize senhas de outros sistemas.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#008A4E] font-bold">·</span>
                <span>Toda alteração é registrada no log de auditoria.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
