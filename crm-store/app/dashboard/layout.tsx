import { AuthButton } from "@/components/auth-button";
import Sidebar from "@/components/sidebar";
import { getDisplayName, getUserClaims } from "@/lib/auth";
import React, { Suspense } from "react";

export const metadata = {
  title: "Dashboard",
};

export const instant = false;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-[#616167]">
          Carregando...
        </div>
      }
    >
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}

async function DashboardShell({ children }: { children: React.ReactNode }) {
    const claims = await getUserClaims();
    const displayName = getDisplayName(claims);
  return (
    <div className="min-h-screen bg-[#F8F6F4] flex p-3 md:gap-2">
      <Sidebar displayName={displayName}>
        <AuthButton />
      </Sidebar>
      <main className="flex-1 flex flex-col gap-5 lg:pt-0 ">{children}</main>
    </div>
  );
}
