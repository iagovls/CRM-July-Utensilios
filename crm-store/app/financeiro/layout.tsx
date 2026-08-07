import { Suspense } from "react";

export const metadata = {
  title: "Financeiro",
};

export default async function FinanceiroLayout({
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