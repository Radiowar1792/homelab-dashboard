import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session";

/** Routes accessibles sans authentification */
const PUBLIC_PREFIXES = ["/login", "/api/auth/", "/api/health"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token || !(await verifySessionToken(token))) {
    const loginUrl = new URL("/login", request.url);
    // Conserver l'URL cible pour redirection post-login
    loginUrl.searchParams.set("from", pathname);
    const response = NextResponse.redirect(loginUrl);
    if (token) response.cookies.delete(SESSION_COOKIE); // Cookie expiré → nettoyage
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclure les assets statiques Next.js, icônes et fichiers PWA
    "/((?!_next/static|_next/image|favicon\\.ico|icons|manifest\\.json|sw\\.js).*)",
  ],
};
