import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login'];
  
  // Check if the current route is public
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }
  
  // For protected routes, we'll let the client-side handle the redirect
  // since we can't access localStorage in middleware
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};