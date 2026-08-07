import { Suspense } from "react";

export const metadata = {
  title: "Categorias",
};

export default async function CategoriasLayout({
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
