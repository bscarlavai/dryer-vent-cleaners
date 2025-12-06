import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  // Parse cookies from the request header
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieArr = cookieHeader.split('; ').filter(Boolean).map(c => {
    const [name, ...rest] = c.split('=');
    return { name, value: rest.join('=') };
  });

  // We'll collect cookies to set on the response
  let cookiesToSet: { name: string; value: string; options?: any }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieArr,
        setAll: (newCookies) => {
          cookiesToSet = newCookies;
        },
      },
    }
  );

  const { email, password } = await request.json();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (data.session) {
    const response = NextResponse.json({ success: true });
    // Set all cookies provided by Supabase SSR
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, {
        ...options,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.selfcarwashfinder.com' : 'localhost',
      });
    });
    return response;
  }
  return NextResponse.json({ error: 'Login failed' }, { status: 401 });
} 