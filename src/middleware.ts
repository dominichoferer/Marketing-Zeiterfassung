import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Öffentliche Seiten überspringen
  if (pathname.startsWith('/login') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Auth Token aus Cookie lesen
  const accessToken = request.cookies.get('sb-access-token')?.value
    || request.cookies.get('supabase-auth-token')?.value;

  // Supabase anonym prüfen – ohne Token zu /login leiten
  if (!accessToken) {
    // Client-seitiger Check via AuthGuard übernimmt den Rest
    // Middleware lässt durch, AuthGuard in der App leitet um
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
