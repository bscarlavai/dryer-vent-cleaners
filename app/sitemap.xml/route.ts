export const dynamic = 'force-dynamic';
import { MetadataRoute } from 'next'
import { getSupabaseClient } from '@/lib/supabase'
// @ts-ignore
import slugify from '@/lib/slugify'

export async function GET() {
  const baseUrl = 'https://www.dryerventcleaners.co'
  const batchSize = 2000; // Match the batch size in sitemap-locations-[batch].xml

  try {
    const supabase = getSupabaseClient();
    // Get the total count of locations
    const { count: totalLocations, error } = await supabase
      .from('locations')
      .select('id', { count: 'exact', head: true })
      .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
      .eq('review_status', 'approved');

    if (error) {
      console.error('Sitemap index generation error:', error);
      return new Response('Error generating sitemap index', { status: 500 });
    }

    const locationSitemapCount = totalLocations ? Math.ceil(totalLocations / batchSize) : 1;
    const sitemaps = [
      `${baseUrl}/sitemap-static.xml`,
      `${baseUrl}/sitemap-cities.xml`,
      ...Array.from({ length: locationSitemapCount }, (_, i) => `${baseUrl}/sitemap-locations-[batch].xml?batch=${i + 1}`),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${sitemaps.map(url => `<sitemap><loc>${url}</loc></sitemap>`).join('')}
      </sitemapindex>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        // Aggressive caching: 24 hours for CDN, 6 hours for browser
        'Cache-Control': 'public, max-age=21600, s-maxage=86400, stale-while-revalidate=43200',
      },
    });
  } catch (error) {
    console.error('Sitemap index generation error:', error);
    return new Response('Error generating sitemap index', { status: 500 });
  }
}
