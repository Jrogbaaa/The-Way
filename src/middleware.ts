import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Temporary bypass of authentication
export function middleware(request: NextRequest) {
  // Don't perform any authentication checks, just continue
  return NextResponse.next();
}

// Optional: Specify paths that will trigger this middleware
// Currently allowing all routes to pass through
export const config = {
  matcher: [
    // Match all routes (temporarily disabled auth)
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ],
}; 