import { Suspense } from "react";
import TopBar from "@/components/TopBar";

export const metadata = {
  title: "Vendas",
};

export default async function VendasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopBar title="Vendas" subtitle="Visão geral das vendas." />
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full text-[#616167]">
            Carregando...
          </div>
        }
      >
        {children}
      </Suspense>
    </>
  );
}