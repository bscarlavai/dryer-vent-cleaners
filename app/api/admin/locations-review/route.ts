import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '../../../../lib/supabase';

export async function POST(request: NextRequest) {
  // The middleware already ensures authentication, so just proceed
  const supabase = getSupabaseClient();
  try {
    const { id, status } = await request.json();
    if (!id || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const { error } = await supabase
      .from('locations')
      .update({ review_status: status })
      .eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 