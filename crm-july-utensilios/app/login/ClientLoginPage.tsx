"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const LoginForm = dynamic(() => import("./LoginForm"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#F8F6F4] flex items-center justify-center p-4">
      <div className="text-[#616167]">Carregando...</div>
    </div>
  ),
});

interface ClientLoginPageProps {
  initialNext: string | null;
}

export default function ClientLoginPage({ initialNext }: ClientLoginPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F6F4] flex items-center justify-center p-4">
          <div className="text-[#616167]">Carregando...</div>
        </div>
      }
    >
      <LoginForm initialNext={initialNext} />
    </Suspense>
  );
}
