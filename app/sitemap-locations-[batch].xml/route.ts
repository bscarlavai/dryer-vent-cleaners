import { getSupabaseClient } from '@/lib/supabase'
import slugify from '@/lib/slugify'

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const baseUrl = 'https://www.dryerventcleaners.co'
  const batchSize = 1000; // Reduced to stay well under CPU limits
  // Get batch number from query param
  const url = new URL(req.url);
  const batchNum = parseInt(url.searchParams.get('batch') || '1', 10);
  const from = (batchNum - 1) * batchSize;
  const to = from + batchSize - 1;

  try {
    const supabase = getSupabaseClient();
    const { data: locations, error } = await supabase
      .from('locations')
      .select('slug, state, city_slug')  // Removed updated_at - not used
      .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
      .eq('review_status', 'approved')
      .range(from, to);

    if (error) {
      console.error('Sitemap generation error:', error);
      return new Response('Error generating sitemap', { status: 500 });
    }

    // Build URLs array efficiently
    const urlEntries: string[] = [];
    for (const location of locations || []) {
      urlEntries.push(`<url><loc>${baseUrl}/states/${slugify(location.state)}/${location.city_slug}/${location.slug}</loc></url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        // Aggressive caching: 7 days for CDN, 1 day for browser
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
} 