import React, { Suspense } from "react";

export const metadata = {
  title: "Dashboard",
};

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

async function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="min-h-screen bg-[#F8F6F4] flex p-3 md:gap-2">
      <main className="flex-1 flex flex-col gap-5 lg:pt-0 ">
        {children}
      </main>
    </div>
  );
}
