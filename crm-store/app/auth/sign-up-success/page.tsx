import { ChefHat, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function Page() {
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

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-[#2A2933] text-xl font-bold text-center mb-2">
            Thank you for signing up!
          </h2>
          <p className="text-[#616167] text-sm text-center mb-4 font-medium">
            Check your email to confirm
          </p>
          <p className="text-[#616167] text-sm text-center">
            You&apos;ve successfully signed up. Please check your email to
            confirm your account before signing in.
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
      </div>
    </div>
  );
}
