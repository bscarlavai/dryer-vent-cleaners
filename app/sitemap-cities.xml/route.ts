import { getSupabaseClient } from '@/lib/supabase'
import slugify from '@/lib/slugify'

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = 'https://www.dryerventcleaners.co'

  try {
    const supabase = getSupabaseClient();

    // Use raw SQL via rpc to get distinct city/state combinations
    // This is MUCH more efficient than fetching all rows and deduping in JS
    const { data: cities, error } = await supabase
      .rpc('get_distinct_cities');

    if (error) {
      // Fallback if RPC doesn't exist - use less efficient method
      console.warn('RPC get_distinct_cities not found, using fallback:', error.message);

      const { data: locations, error: fallbackError } = await supabase
        .from('locations')
        .select('city_slug, state')
        .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
        .eq('review_status', 'approved');

      if (fallbackError) {
        console.error('Cities sitemap generation error:', fallbackError);
        return new Response('Error generating cities sitemap', { status: 500 });
      }

      // Dedupe in JS as fallback
      const cityMap: Record<string, boolean> = {};
      const urls: string[] = [];
      for (const location of locations || []) {
        const key = `${location.city_slug}-${slugify(location.state)}`;
        if (!cityMap[key]) {
          cityMap[key] = true;
          urls.push(`<url><loc>${baseUrl}/cities/${key}</loc></url>`);
        }
      }

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

      return new Response(xml, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
        },
      });
    }

    // Build URLs from distinct cities returned by RPC
    const urls = (cities || []).map((city: { city_slug: string; state: string }) =>
      `<url><loc>${baseUrl}/cities/${city.city_slug}-${slugify(city.state)}</loc></url>`
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        // Aggressive caching: 7 days for CDN, 1 day for browser
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Cities sitemap generation error:', error);
    return new Response('Error generating cities sitemap', { status: 500 });
  }
} 