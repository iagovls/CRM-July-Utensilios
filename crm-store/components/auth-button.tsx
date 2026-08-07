import Link from "next/link";
import { LogoutButton } from "./logout-button";
import { CircleUserRound } from "lucide-react";
import { getDisplayName, getUserClaims, type UserClaims } from "@/lib/auth";

export async function AuthButton() {
  const claims = await getUserClaims();
  const displayName = getDisplayName(claims);

  return (
    <div className="flex gap-2 mt-auto pt-2.5">
      <Link href="/perfil" className="flex items-center gap-2.5 mb-3">
        <div className="w-10 h-10 bg-[#FFDAD8] rounded-xl flex items-center justify-center">
          <CircleUserRound className="w-5 h-5 text-[#2A2933]" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[#2A2933] text-sm font-semibold font-['Inter']">
            {displayName}
          </span>
        </div>
      </Link>
      <LogoutButton />
    </div>
  );
}

export type { UserClaims };
