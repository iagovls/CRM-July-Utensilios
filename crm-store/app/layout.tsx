import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Sidebar from "@/components/sidebar";
import { Suspense } from "react";
import { AuthButton } from "@/components/auth-button";
import { getDisplayName, getUserClaims } from "@/lib/auth";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const claims = await getUserClaims();
    const displayName = getDisplayName(claims);
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >

              <div className="min-h-screen bg-[#F8F6F4] flex p-3 gap-2 rounded-xl">
                <Sidebar displayName={displayName}>
                  <Suspense
                    fallback={
                      <div className="text-sm text-[#939399] font-['Inter'] px-3 py-2">
                        Carregando...
                      </div>
                    }
                  >
                    <AuthButton />
                  </Suspense>
                </Sidebar>
                <main className="flex-1 flex flex-col gap-5 pt-14 lg:pt-0 ">
                  {children}
                </main>
              </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
