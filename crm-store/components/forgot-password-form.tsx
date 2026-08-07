"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChefHat, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
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

        {success ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-[#2A2933] text-xl font-bold text-center mb-2">
              Check Your Email
            </h2>
            <p className="text-[#616167] text-sm text-center mb-4">
              Password reset instructions sent
            </p>
            <p className="text-[#616167] text-sm text-center">
              If you registered using your email and password, you will receive
              a password reset email.
            </p>
            <div className="mt-6 text-center text-sm text-[#616167]">
              <Link
                href="/auth/login"
                className="text-[#2A2933] underline underline-offset-4 font-medium"
              >
                Back to login
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h2 className="text-[#2A2933] text-xl font-bold mb-2">
                Reset Your Password
              </h2>
              <p className="text-[#616167] text-sm">
                Type in your email and we&apos;ll send you a link to reset your
                password
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="flex flex-col gap-4" noValidate>
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#FFDAD8] hover:bg-[#FFC5C2] disabled:bg-[#E8E1DF] text-[#2A2933] font-semibold rounded-xl transition-colors mt-2"
              >
                {isLoading ? "Sending..." : "Send reset email"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-[#616167]">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-[#2A2933] underline underline-offset-4 font-medium"
              >
                Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
