"use client";

import { Search, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface TopBarProps {
  title: string;
  subtitle: string;
  showSearch?: boolean;
  showNewSale?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

export default function TopBar({
  title,
  subtitle,
  showSearch = true,
  showNewSale = true,
  searchPlaceholder = "Buscar cliente, venda ou produto",
  onSearch,
}: TopBarProps) {
  const router = useRouter();

  return (
    <div className="w-full flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-[#2A2933] text-[28px] font-semibold font-['Inter'] leading-tight">
          {title}
        </h1>
        <p className="text-[#616167] text-sm font-normal font-['Inter']">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {showSearch && (
          <div className="w-[360px] h-[52px] bg-white rounded-full px-[18px] flex items-center gap-2.5">
            <Search className="w-5 h-5 text-[#939399]" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch?.(e.target.value)}
              className="flex-1 bg-transparent text-[#939399] text-sm font-normal font-['Inter'] outline-none placeholder:text-[#939399]"
            />
          </div>
        )}

        {showNewSale && (
          <button
            onClick={() => router.push("/vendas/nova")}
            className="h-[52px] px-5 bg-[#FFDAD8] hover:bg-[#FFC5C2] rounded-full flex items-center gap-2.5 transition-colors"
          >
            <Plus className="w-5 h-5 text-[#2A2933]" />
            <span className="text-[#2A2933] text-sm font-semibold font-['Inter']">
              Nova venda
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
