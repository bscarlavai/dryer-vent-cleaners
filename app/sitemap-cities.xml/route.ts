import { getSupabaseClient } from '@/lib/supabase'
import slugify from '@/lib/slugify'

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = 'https://www.dryerventcleaners.co'

  try {
    const supabase = getSupabaseClient();

    // Use RPC to get distinct city/state combinations efficiently
    const { data: cities, error } = await supabase
      .rpc('get_distinct_cities');

    if (error) {
      console.error('Cities sitemap RPC error:', error.message, error.code, error.details);
      return new Response(`Error generating cities sitemap: ${error.message}`, { status: 500 });
    }

    if (!cities || cities.length === 0) {
      console.warn('Cities sitemap: No cities returned from RPC');
      return new Response('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>', {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Build URLs from distinct cities returned by RPC
    const urls = cities.map((city: { city_slug: string; state: string }) =>
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
    return new Response(`Error generating cities sitemap: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}
