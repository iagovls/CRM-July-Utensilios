"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface LoginFormProps {
  initialNext?: string | null;
}

function normalizeNext(raw: string | null | undefined): string {
  if (!raw) return "/vendas";
  if (!raw.startsWith("/")) return "/vendas";
  if (raw.startsWith("//")) return "/vendas";
  return raw;
}

function isAlreadyAt(path: string): boolean {
  if (typeof window === "undefined") return false;
  const target = new URL(path, window.location.origin);
  return target.pathname === window.location.pathname;
}


export default function LoginForm({ initialNext }: LoginFormProps) {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const redirectTo = normalizeNext(initialNext);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const didRedirectRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || didRedirectRef.current) return;
    if (isAlreadyAt(redirectTo)) return;
    didRedirectRef.current = true;
    router.replace(redirectTo);
  }, [isAuthenticated, redirectTo, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const id = identifier.trim();
      const looksLikeEmail = /@/.test(id);
      const normalized = looksLikeEmail ? id.toLowerCase() : id;
      await login(normalized, password);

      didRedirectRef.current = true;
      router.push(redirectTo);
    } catch (err: unknown) {
      didRedirectRef.current = false;
      const errorObj = err as { name?: string; message?: string; status?: number };
      const msg = String(errorObj.message ?? "");
      if (
        errorObj.name === "NOT_PROJECT_MEMBER" ||
        msg === "NOT_PROJECT_MEMBER"
      ) {
        setError(
          "Você não tem permissão para acessar este projeto. Entre em contato com o administrador.",
        );
      } else if (msg.toLowerCase().includes("invalid")) {
        setError("E-mail ou senha incorretos. Verifique e tente novamente.");
      } else if (msg) {
        setError(msg);
      } else {
        setError("Erro ao fazer login. Tente novamente.");
      }
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F6F4] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#FFDAD8] rounded-2xl flex items-center justify-center mb-4">
            <ChefHat className="w-8 h-8 text-[#2A2933]" />
          </div>
          <h1 className="text-[#2A2933] text-2xl font-bold font-['Inter']">
            July Utensílios
          </h1>
          <p className="text-[#616167] text-sm mt-1">CRM Comercial</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 pr-12 bg-[#F8F6F4] rounded-xl text-[#2A2933] outline-none focus:ring-2 focus:ring-[#FFDAD8] transition-all"
                placeholder="Digite sua senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#616167]"
                tabIndex={-1}
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
            disabled={isSubmitting}
            className="w-full h-12 bg-[#FFDAD8] hover:bg-[#FFC5C2] disabled:bg-[#E8E1DF] text-[#2A2933] font-semibold rounded-xl transition-colors mt-2"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
