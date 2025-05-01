import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTES } from '@/lib/config';
import { auth } from "./auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  const isAuthRoute = nextUrl.pathname.startsWith("/auth");
  
  // Redirect authenticated users away from auth pages
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }
  
  // Redirect unauthenticated users to login
  const isApiRoute = nextUrl.pathname.startsWith("/api");
  const isPublicRoute = ["/", "/about"].includes(nextUrl.pathname);
  
  if (!isLoggedIn && !isAuthRoute && !isPublicRoute && !isApiRoute) {
    return NextResponse.redirect(new URL("/auth/login", nextUrl));
  }
  
  return NextResponse.next();
});

// Match all routes except for assets, api routes, etc.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}; 