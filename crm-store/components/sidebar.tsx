"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  Tag,
  ReceiptText,
  Banknote,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard"},
  { href: "/clientes", icon: Users, label: "Clientes" },
  { href: "/produtos", icon: Package, label: "Produtos" },
  { href: "/categorias", icon: Tag, label: "Categorias" },
  { href: "/vendas", icon: ReceiptText, label: "Vendas" },
  { href: "/financeiro", icon: Banknote, label: "Financeiro"},
];

export default function Sidebar({
  displayName,
  children,
}: {
  displayName?: string;
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = () => {
    setIsOpen(false);
  };

  const username = displayName || "Usuário";

  return (
    <>
      <header
        className={`lg:hidden fixed top-0 left-0 right-0 z-40 h-16 px-4 flex items-center gap-3 bg-[#F8F6F4] transition-opacity duration-200 ${
          isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center shrink-0"
        >
          {isOpen ? (
            <X className="w-5 h-5 text-[#2A2933]" />
          ) : (
            <Menu className="w-5 h-5 text-[#2A2933]" />
          )}
        </button>
        <div className="flex min-w-0 text-[#2A2933] text-sm font-semibold font-['Inter'] truncate">
          <span >
            Olá,
          </span>
          <span >
            {username}
          </span>
        </div>
      </header>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          w-[280px] h-full
          bg-white md:rounded-xl
          p-6 flex flex-col gap-6
          transform transition-transform duration-300 ease-in-out
          lg:transform-none
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <Image
          src="/logo.jpeg"
          alt="July Utensílios"
          width={180}
          height={60}
          priority
          className="h-auto w-auto rounded-xl"
        />

        <span className="text-[#939399] text-xs font-semibold font-['Inter']">
          Módulos
        </span>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={`flex items-center gap-2.5 px-3 py-3 rounded-[18px] transition-colors ${
                  isActive ? "bg-[#FFDAD8]" : "bg-[#F8F6F4] hover:bg-[#F0EEEC]"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? "text-[#2A2933]" : "text-[#616167]"}`}
                />
                <span
                  className={`font-['Inter'] ${
                    isActive
                      ? "text-[#2A2933] font-semibold"
                      : "text-[#2A2933] font-medium"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">{children}</div>
      </aside>

      <div className="h-16 lg:hidden shrink-0" aria-hidden />
    </>
  );
}
