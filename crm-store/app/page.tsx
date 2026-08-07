
import { Suspense } from "react";
import DashboardPage from "./dashboard/page";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full text-[#616167]">
          Carregando...
        </div>
      }
    >
      <DashboardPage />
    </Suspense>
  );
}
