import { type NextRequest, NextResponse } from "next/server";

function getSupabaseCookieNames(url: string): string[] {
  const host =
    typeof process === "object" && process.env?.NEXT_PUBLIC_SUPABASE_URL
      ? (() => {
          try {
            return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host;
          } catch {
            return "";
          }
        })()
      : "";

  const slug = host
    .replace(/^https?:\/\//, "")
    .replace(/\W+/g, "-")
    .replace(/^-|-$/g, "");

  const base = slug ? `sb-${slug}` : "sb";
  return [
    `${base}-auth-token`,
    `${base}-auth-token-code-verifier`,
    "sb-access-token",
    "sb-refresh-token",
  ];
}

function hasSessionCookie(request: NextRequest): boolean {
  const names = getSupabaseCookieNames(request.url);
  for (const name of names) {
    const value = request.cookies.get(name)?.value;
    if (value && value.length > 0) return true;
  }
  return false;
}

function parseAuthSession(request: NextRequest): boolean {
  const names = getSupabaseCookieNames(request.url);
  for (const name of names) {
    const value = request.cookies.get(name)?.value;
    if (!value) continue;
    try {
      const decoded = decodeURIComponent(value);
      if (decoded.includes(`"access_token"`) || decoded.includes(`"refresh_token"`)) {
        return true;
      }
    } catch {
      // ignore decode errors
    }
  }
  return false;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicAsset =
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon") ||
    pathname === "/site.webmanifest" ||
    pathname === "/manifest.webmanifest" ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|avif)$/.test(pathname);

  if (isPublicAsset) {
    return NextResponse.next();
  }

  const isLoginRoute = pathname.startsWith("/login");
  const isAuthenticated = parseAuthSession(request) || hasSessionCookie(request);

  if (!isAuthenticated && !isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({
    request,
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|avif)$).*)",
  ],
};
