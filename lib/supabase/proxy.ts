import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseConfig } from "@/lib/env";

const PUBLIC_PREFIXES = [
  "/login",
  "/criar-conta",
  "/recuperar-senha",
  "/redefinir-senha",
  "/auth",
  "/convite",
  "/p",
  "/offline",
  "/manifest.webmanifest",
  "/privacidade",
  "/termos",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Refreshes the Supabase session cookie and enforces the auth gate.
 * Runs in the Next.js proxy (formerly middleware) on every app route.
 */
export async function updateSession(request: NextRequest) {
  const config = getSupabaseConfig();

  // Setup mode: the UI explains what is missing. Guarding happens again in
  // the authenticated layout, so no private data is ever rendered.
  if (!config) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const isAuthScreen = pathname === "/login" || pathname === "/criar-conta";

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname !== "/") {
      url.searchParams.set("proximo", `${pathname}${search}`);
    }
    return NextResponse.redirect(url);
  }

  if (user && isAuthScreen) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
