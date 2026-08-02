"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardNotFound() {
  const pathname = usePathname();
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-xl bg-white rounded-[28px] p-6 md:p-10 flex flex-col items-center text-center gap-5 shadow-sm">
        <div className="w-16 h-16 rounded-[20px] flex items-center justify-center text-2xl font-bold bg-gradient-to-br from-[#FFDAD8] via-[#FFE9E7] to-[#FFF4F2] text-[#2A2933]">
          404
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-[#2A2933] text-xl md:text-2xl font-bold">
            Página não encontrada
          </h2>
          <p className="text-[#616167] text-sm md:text-base">
            A rota{" "}
            <code className="px-2 py-0.5 rounded-md bg-[#F8F6F4] text-[#2A2933] text-sm font-mono break-all">
              {pathname}
            </code>{" "}
            não existe no painel.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <Link
            href="/vendas"
            className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-[#2A2933] text-white font-semibold no-underline shadow-sm"
          >
            Ir para Vendas
          </Link>
          <Link
            href="/clientes"
            className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-[#F8F6F4] text-[#2A2933] font-semibold no-underline"
          >
            Ver clientes
          </Link>
        </div>
      </div>
    </div>
  );
}
