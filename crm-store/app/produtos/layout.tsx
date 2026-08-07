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
      {children}
    </Suspense>
  );
}