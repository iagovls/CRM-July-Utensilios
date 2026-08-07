import React, { Suspense } from "react";
import Sidebar from "@/components/sidebar";
import { AuthButton } from "@/components/auth-button";
import TopBar from "@/components/TopBar";
import { getDisplayName, getUserClaims } from "@/lib/auth";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const claims = await getUserClaims();
  const displayName = getDisplayName(claims);

  return (
    <div className="min-h-screen bg-[#F8F6F4] flex p-3 gap-2">
      <Sidebar displayName={displayName}>
        <Suspense
          fallback={
            <div className="text-sm text-[#939399] font-['Inter'] px-3 py-2">
              Carregando...
            </div>
          }
        >
          <AuthButton />
        </Suspense>
      </Sidebar>
      <main className="flex-1 flex flex-col gap-5 pt-14 lg:pt-0">
        <TopBar
          title="Dashboard"
          subtitle="Visão geral do sistema."
          showSearch={false}
          showNewItem={false}
        />
        {children}
      </main>
    </div>
  );
}
