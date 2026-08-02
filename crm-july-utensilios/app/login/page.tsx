"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChefHat, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("next") ?? "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isLoading = isPending;
  const { login } = useAuth();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await login(username.trim().toLowerCase(), password);
        router.push(redirectTo);
        router.refresh();
      } catch (err: unknown) {
        const errorObj = err as { name?: string; message?: string };
        if (errorObj.name === "NOT_PROJECT_MEMBER" || errorObj.message === "NOT_PROJECT_MEMBER") {
          setError("Você não tem permissão para acessar este projeto. Entre em contato com o administrador.");
        } else if (errorObj.message) {
          setError(errorObj.message);
        } else {
          setError("Erro ao fazer login. Tente novamente.");
        }
      }
    });
  }

  return (
    <div className="min-h-screen bg-[#F8F6F4] flex items-center justify-center p-4">
      <div className="w-full max-w-100 bg-white rounded-4xl p-8 shadow-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#FFDAD8] rounded-2xl flex items-center justify-center mb-4">
            <ChefHat className="w-8 h-8 text-[#2A2933]" />
          </div>
          <h1 className="text-[#2A2933] text-2xl font-bold font-['Inter']">
            July Utensílios
          </h1>
          <p className="text-[#616167] text-sm mt-1">CRM Comercial</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[#2A2933] text-sm font-medium mb-2">
              E-mail ou usuário
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-12 px-4 bg-[#F8F6F4] rounded-xl text-[#2A2933] outline-none focus:ring-2 focus:ring-[#FFDAD8] transition-all"
              placeholder="Digite seu e-mail"
              required
            />
          </div>

          <div>
            <label className="block text-[#2A2933] text-sm font-medium mb-2">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 pr-12 bg-[#F8F6F4] rounded-xl text-[#2A2933] outline-none focus:ring-2 focus:ring-[#FFDAD8] transition-all"
                placeholder="Digite sua senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#616167]"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-[#FFDAD8] hover:bg-[#FFC5C2] disabled:bg-[#E8E1DF] text-[#2A2933] font-semibold rounded-xl transition-colors mt-2"
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F6F4] flex items-center justify-center p-4">
          <div className="text-[#616167]">Carregando...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
