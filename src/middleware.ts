import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
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
  
  // List of public API routes that should be accessible without authentication
  const publicApiRoutes = [
    "/api/analyze-social-post",
    "/api/replicate",
    "/api/image",
    "/api/upload/training-images",
    "/api/training/prepare"
  ];
  
  // Check if the current API route is public
  const isPublicApiRoute = isApiRoute && publicApiRoutes.some(route => 
    nextUrl.pathname.startsWith(route)
  );
  
  // List of public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/about",
    // Allow access to key tools without login
    "/generate/image",
    "/social-analyzer",
    "/social-trends",
    "/upload-post",
    "/models",
    "/models/cristina",
    "/models/jaime",
    "/models/bea",
    // Add any other tool pages you want users to try before login
  ];
  
  // Check if the current path or its parent path is in publicRoutes
  const isPublicRoute = publicRoutes.some(route => 
    nextUrl.pathname === route || 
    nextUrl.pathname.startsWith(`${route}/`) ||
    // Special case for models directory
    (route === "/models" && nextUrl.pathname.startsWith("/models/"))
  );
  
  if (!isLoggedIn && !isAuthRoute && !isPublicRoute && !isPublicApiRoute && !isApiRoute) {
    return NextResponse.redirect(new URL("/auth/login", nextUrl));
  }
  
  return NextResponse.next();
});

// Match all routes except for assets, api routes, etc.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}; 