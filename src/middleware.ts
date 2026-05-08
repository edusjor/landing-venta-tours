import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  getInternalAgencySlugFromHost,
  normalizeHost,
  PUBLIC_AGENCY_SLUG_COOKIE,
  PUBLIC_AGENCY_SLUG_HEADER,
  PUBLIC_REQUEST_HOST_HEADER,
  PUBLIC_ROUTE_KIND_HEADER,
} from './lib/publicAgencyHost';

function isInternalPath(pathname: string): boolean {
  return pathname.startsWith('/_next')
    || pathname.startsWith('/favicon.ico')
    || pathname.startsWith('/robots.txt')
    || pathname.startsWith('/sitemap.xml');
}

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin'
    || pathname.startsWith('/admin/')
    || pathname === '/api/admin'
    || pathname.startsWith('/api/admin/')
    || pathname === '/superadmin'
    || pathname.startsWith('/superadmin/')
    || pathname === '/api/superadmin'
    || pathname.startsWith('/api/superadmin/');
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isInternalPath(pathname)) {
    return NextResponse.next();
  }

  const routeKind = isAdminPath(pathname) ? 'admin' : 'public';
  const requestHeaders = new Headers(request.headers);
  const normalizedHost = normalizeHost(request.headers.get('x-forwarded-host') || request.headers.get('host') || '');

  requestHeaders.set(PUBLIC_ROUTE_KIND_HEADER, routeKind);
  if (normalizedHost) {
    requestHeaders.set(PUBLIC_REQUEST_HOST_HEADER, normalizedHost);
  }

  if (routeKind === 'public') {
    const publicAgencySlug = getInternalAgencySlugFromHost(normalizedHost);
    if (publicAgencySlug) {
      requestHeaders.set(PUBLIC_AGENCY_SLUG_HEADER, publicAgencySlug);
    }

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    if (publicAgencySlug) {
      response.cookies.set(PUBLIC_AGENCY_SLUG_COOKIE, publicAgencySlug, {
        path: '/',
        sameSite: 'lax',
      });
    } else {
      response.cookies.delete(PUBLIC_AGENCY_SLUG_COOKIE);
    }

    return response;
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.cookies.delete(PUBLIC_AGENCY_SLUG_COOKIE);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.[^/]+$).*)'],
};