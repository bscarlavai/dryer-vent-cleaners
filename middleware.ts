import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Try to extract the Supabase session JWT manually
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('https://')[1]?.split('.')[0];
  const sessionCookieName = `sb-${projectRef}-auth-token`;
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader
      ? cookieHeader.split('; ').filter(Boolean).map(c => {
          const [name, ...rest] = c.split('=');
          return [name, rest.join('=')];
        })
      : []
  );
  const sessionCookie = cookies[sessionCookieName];
  let accessToken = '';
  if (sessionCookie) {
    try {
      let jsonString = sessionCookie;
      if (jsonString.startsWith('base64-')) {
        jsonString = Buffer.from(jsonString.replace('base64-', ''), 'base64').toString('utf-8');
      }
      const parsed = JSON.parse(jsonString);
      accessToken = parsed?.access_token || '';
    } catch (e) {
    }
  }

  // Use the Supabase client to validate the JWT
  let user = null;
  let error = null;
  if (accessToken) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error: userError } = await supabase.auth.getUser(accessToken);
    user = data.user;
    error = userError;
  }

  // Allow access to the login page without authentication
  if (req.nextUrl.pathname === '/admin/login') {
    return res;
  }

  if (!user && req.nextUrl.pathname.startsWith('/admin')) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    loginUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
}; 