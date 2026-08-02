import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "July Utensilios - CRM",
    template: "%s | July Utensilios - CRM",
  },
  description:
    "CRM da July Utensilios para gestao de clientes, produtos, vendas, financeiro e relacionamento.",
  applicationName: "July Utensilios - CRM",
  authors: [{ name: "July Utensilios" }],
  keywords: [
    "CRM",
    "July Utensilios",
    "gestao de clientes",
    "vendas",
    "produtos",
    "financeiro",
  ],
  category: "business",
  openGraph: {
    type: "website",
    title: "July Utensilios - CRM",
    description:
      "CRM da July Utensilios para gestao de clientes, produtos, vendas e financeiro.",
    siteName: "July Utensilios - CRM",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "July Utensilios - CRM",
    description:
      "CRM da July Utensilios para gestao de clientes, produtos, vendas e financeiro.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
        </Providers>
        </body>
    </html>
  );
}
