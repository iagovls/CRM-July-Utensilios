import TopBar from "@/components/TopBar";
import { Suspense } from "react";

export const metadata = {
  title: "Produtos",
};

export default async function ProdutosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full text-[#616167]">
          Carregando...
        </div>
      }
    >
      <TopBar
        title="Produtos"
        subtitle="Catálogo, estoque e margem por item."
      />
      {children}
    </Suspense>
  );
}