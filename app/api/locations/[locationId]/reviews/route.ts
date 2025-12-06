import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// Helper: get IP address from request
function getIp(req: NextRequest) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.ip ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

// POST: Submit a review
export async function POST(req: NextRequest, { params }: { params: { locationId: string } }) {
  const supabase = getSupabaseClient();
  const body = await req.json();
  const { recommended, comment, email, honeypot } = body;
  const location_id = params.locationId;
  const ip_address = getIp(req);
  const user_agent = req.headers.get('user-agent') || '';

  // Honeypot check
  if (honeypot && honeypot.length > 0) {
    return NextResponse.json({ error: 'Spam detected.' }, { status: 400 });
  }

  // Rate limit: max 3 reviews per location per IP per day
  const { count } = await supabase
    .from('location_reviews')
    .select('id', { count: 'exact', head: true })
    .eq('location_id', location_id)
    .eq('ip_address', ip_address)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
  }

  // Insert user if email provided
  let review_user_id = null;
  if (email) {
    const { data: user, error: userError } = await supabase
      .from('location_review_users')
      .upsert({ email }, { onConflict: 'email' })
      .select('id')
      .single();
    if (userError) {
      return NextResponse.json({ error: 'Could not save user.' }, { status: 500 });
    }
    review_user_id = user.id;
  }

  // Insert review
  const { error } = await supabase.from('location_reviews').insert({
    location_id,
    review_user_id,
    recommended,
    comment,
    ip_address,
    user_agent,
    status: 'pending',
  });
  if (error) {
    return NextResponse.json({ error: 'Could not save review.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// GET: Fetch review stats and recent comments using SQL function
export async function GET(req: NextRequest, { params }: { params: { locationId: string } }) {
  const supabase = getSupabaseClient();
  const location_id = params.locationId;
  const { data, error } = await supabase
    .rpc('location_review_stats', { loc_id: location_id });
  if (error) {
    return NextResponse.json({ error: 'Could not fetch review stats.' }, { status: 500 });
  }
  return NextResponse.json(data && data[0] ? data[0] : {
    total: 0,
    recommended_count: 0,
    percent_recommended: 0,
    recent_comments: []
  });
} 