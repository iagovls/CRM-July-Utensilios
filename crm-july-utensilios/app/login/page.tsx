import ClientLoginPage from "./ClientLoginPage";

interface LoginPageProps {
  searchParams?: Promise<{ next?: string | string[] | null }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const rawNext = resolvedSearchParams?.next ?? null;
  const next = Array.isArray(rawNext) ? rawNext[0] ?? null : rawNext;
  return <ClientLoginPage initialNext={next} />;
}
