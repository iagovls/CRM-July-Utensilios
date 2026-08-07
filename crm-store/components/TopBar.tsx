"use client";

import { Search } from "lucide-react";

interface TopBarProps {
  title: string;
  subtitle: string;
  showSearch?: boolean;
  showNewItem?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

export default function TopBar({
  title,
  subtitle,
  showSearch = true,
  searchPlaceholder = "Buscar cliente, venda ou produto",
  onSearch,
}: TopBarProps) {

  return (
    <div className="card-surface w-full flex flex-col items-start justify-between gap-0 rounded-xl lg:flex-row lg:items-center">
      <div className="flex flex-col gap-1 w-full text-center lg:text-left">
        <h1 className="heading-1">{title}</h1>
        <p className="subtitle">{subtitle}</p>
      </div>

      <div className="flex flex-col items-center gap-3 mt-1 w-full lg:w-auto lg:flex-row lg:justify-end">
        {showSearch && (
          <div className="field-pill w-full lg:w-[var(--field-width)]">
            <Search className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch?.(e.target.value)}
              className="flex-1 bg-transparent text-sm font-normal text-[hsl(var(--muted-foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))] placeholder:font-normal"
            />
          </div>
        )}
      </div>
    </div>
  );
}
