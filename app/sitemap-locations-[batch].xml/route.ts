import { getSupabaseClient } from '@/lib/supabase'
import slugify from '@/lib/slugify'

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const baseUrl = 'https://www.dryerventcleaners.co'
  const batchSize = 2000; // Reduced from 5000 to prevent memory issues
  // Get batch number from query param
  const url = new URL(req.url);
  const batchNum = parseInt(url.searchParams.get('batch') || '1', 10);
  const from = (batchNum - 1) * batchSize;
  const to = from + batchSize - 1;
  
  try {
    const supabase = getSupabaseClient();
    const { data: locations, error } = await supabase
      .from('locations')
      .select('slug, state, city_slug, updated_at')
      .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
      .eq('review_status', 'approved')
      .range(from, to);
    
    if (error) {
      console.error('Sitemap generation error:', error);
      return new Response('Error generating sitemap', { status: 500 });
    }
    
    const urls = (locations || []).map(location => `/states/${slugify(location.state)}/${location.city_slug}/${location.slug}`);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${urls.map(url => `<url><loc>${baseUrl}${url}</loc></url>`).join('')}
      </urlset>`;
    
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        // Aggressive caching: 24 hours for CDN, 6 hours for browser
        'Cache-Control': 'public, max-age=21600, s-maxage=86400, stale-while-revalidate=43200',
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
} 