"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChefHat, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;

      const appId = data.session?.user?.app_metadata?.app_id;
      console.log("appId", appId)
      if (appId !== "july_utensilios") {
        await supabase.auth.signOut();
        throw new Error("Usuário não autorizado para esta aplicação.");
      }

      router.refresh();
      router.replace("/dashboard");
    } catch (error: unknown) {
      console.log("Login error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn("min-h-screen bg-[#F8F6F4] flex items-center justify-center p-4", className)}
      {...props}
    >
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

        <form onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="email" className="block text-[#2A2933] text-sm font-medium mb-2">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 bg-[#F8F6F4] rounded-xl text-[#2A2933] outline-none focus:ring-2 focus:ring-[#FFDAD8] transition-all border-0 shadow-none"
            />
          </div>

          <div>
            <div className="flex items-center mb-2">
              <Label htmlFor="password" className="block text-[#2A2933] text-sm font-medium">
                Password
              </Label>
              <Link
                href="/auth/forgot-password"
                className="ml-auto inline-block text-sm text-[#616167] underline-offset-4 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 pr-12 bg-[#F8F6F4] rounded-xl text-[#2A2933] outline-none focus:ring-2 focus:ring-[#FFDAD8] transition-all border-0 shadow-none"
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
            disabled={isLoading}
            className="w-full h-12 bg-[#FFDAD8] hover:bg-[#FFC5C2] disabled:bg-[#E8E1DF] text-[#2A2933] font-semibold rounded-xl transition-colors mt-2"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[#616167]">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/sign-up"
            className="text-[#2A2933] underline underline-offset-4 font-medium"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
