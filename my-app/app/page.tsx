"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import DashboardPage from "./(dashboard)/page";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/login");
      }
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F4]">
        <div className="text-[#616167]">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8F6F4] p-4 lg:p-6">
      <div className="flex gap-4 lg:gap-6 h-[calc(100vh-32px)] lg:h-[calc(100vh-48px)]">
        <Sidebar />
        <div className="flex-1 flex flex-col gap-4 lg:gap-5 overflow-hidden pt-10 lg:pt-0">
          <main className="flex-1 min-h-0">
            <DashboardPage />
          </main>
        </div>
      </div>
    </div>
  );
}
