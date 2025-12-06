import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '../../../../lib/supabase';

// GET /api/admin/locations?page=0&pageSize=10&status=pending&search=foo&only24=false
export async function GET(request: NextRequest) {
  // The middleware already ensures authentication, so just proceed
  const supabase = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0', 10);
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '10', 10), 50); // Cap at 50 to prevent large responses
  const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' || 'pending';
  const search = searchParams.get('search') || '';
  const only24 = searchParams.get('only24') === 'true';

  const from = page * pageSize;
  const to = from + pageSize - 1;

  try {
    let query;
    if (only24) {
      query = supabase
        .from('locations')
        .select('*, location_hours(*), location_images(cf_image_id, image_type, is_primary), reviews_tags, street_view_url, open_24_hour_locations!inner(location_id, review_status)', { count: 'exact' })
        .eq('open_24_hour_locations.review_status', status);
    } else {
      query = supabase
        .from('locations')
        .select('*, location_hours(*), location_images(cf_image_id, image_type, is_primary), reviews_tags, street_view_url', { count: 'exact' })
        .eq('review_status', status);
    }
    if (search && search.trim()) {
      const searchVal = `%${search.trim()}%`;
      query = query.or(`name.ilike.${searchVal},description.ilike.${searchVal},state.ilike.${searchVal},city.ilike.${searchVal}`);
    }
    // Order by created_at (newest first) then by id for consistent pagination
    query = query.order('created_at', { ascending: false }).order('id', { ascending: false }).range(from, to);
    const { data, error, count } = await query;
    if (error) {
      console.error('Admin locations error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data, count }, {
      headers: {
        'Cache-Control': 'private, max-age=60, s-maxage=60', // Cache for 1 minute (private for admin)
      },
    });
  } catch (error: any) {
    console.error('Admin locations error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 