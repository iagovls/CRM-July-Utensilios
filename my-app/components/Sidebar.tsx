"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  Tag,
  ReceiptText,
  Banknote,
  CircleUserRound,
  ChefHat,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard", adminOnly: true },
  { href: "/clientes", icon: Users, label: "Clientes" },
  { href: "/produtos", icon: Package, label: "Produtos" },
  { href: "/categorias", icon: Tag, label: "Categorias" },
  { href: "/vendas", icon: ReceiptText, label: "Vendas" },
  { href: "/financeiro", icon: Banknote, label: "Financeiro", adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const visibleNavItems = navItems.filter((item) => !item.adminOnly || user?.is_admin_role);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-[#2A2933]" />
        ) : (
          <Menu className="w-5 h-5 text-[#2A2933]" />
        )}
      </button>

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
          bg-white lg:rounded-[32px] rounded-none lg:rounded-r-[32px]
          p-6 flex flex-col gap-6
          transform transition-transform duration-300 ease-in-out
          lg:transform-none
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#FFDAD8] rounded-2xl flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-[#2A2933]" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[#2A2933] text-lg font-semibold font-['Inter']">
              July Utensílios
            </span>
            <span className="text-[#616167] text-xs font-normal font-['Inter']">
              CRM comercial
            </span>
          </div>
        </div>

        <span className="text-[#939399] text-xs font-semibold font-['Inter']">
          Módulos
        </span>

        <nav className="flex flex-col gap-2">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={`flex items-center gap-2.5 px-3 py-3 rounded-[18px] transition-colors ${
                  isActive
                    ? "bg-[#FFDAD8]"
                    : "bg-[#F8F6F4] hover:bg-[#F0EEEC]"
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

        <div className="mt-auto pt-2.5">
          <Link
            href="/perfil"
            onClick={handleNavClick}
            className="flex items-center gap-2.5 mb-3"
          >
            <div className="w-10 h-10 bg-[#FFDAD8] rounded-xl flex items-center justify-center">
              <CircleUserRound className="w-5 h-5 text-[#2A2933]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[#2A2933] text-sm font-semibold font-['Inter']">
                {user?.username || "Usuário"}
              </span>
              <span className="text-[#616167] text-xs font-normal font-['Inter']">
                {user?.is_admin_role ? "Admin" : "Usuário"}
              </span>
            </div>
          </Link>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 text-[#616167] hover:text-[#C23A2E] hover:bg-[#C23A2E]/10 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium font-['Inter']">Sair</span>
        </button>
        </div>
      </aside>
    </>
  );
}
