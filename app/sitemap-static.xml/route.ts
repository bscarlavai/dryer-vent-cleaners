import { getSupabaseClient } from '@/lib/supabase'
import slugify from '@/lib/slugify'

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = 'https://www.dryerventcleaners.co'

  try {
    // Static pages
    const staticPages = [
      '',
      '/dryer-vent-cleaning-near-me',
      '/states',
      '/privacy',
      '/terms',
    ];

    // Get all valid states
    const supabase = getSupabaseClient();
    const { data: states, error } = await supabase
      .from('locations')
      .select('state')
      .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
      .eq('review_status', 'approved')
      .not('state', 'is', null);

    if (error) {
      console.error('Static sitemap generation error:', error);
      return new Response('Error generating static sitemap', { status: 500 });
    }

    const uniqueStates = Array.from(new Set(states?.map(location => location.state) || []));
    const statePages = uniqueStates.map((state) => `/states/${slugify(state)}`);
    const urls = [...staticPages, ...statePages];
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
    console.error('Static sitemap generation error:', error);
    return new Response('Error generating static sitemap', { status: 500 });
  }
} 