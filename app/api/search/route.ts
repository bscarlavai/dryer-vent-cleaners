import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '../../../lib/supabase'
import { searchLocationsByZipForAPI } from '../../../lib/locationUtils'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] }, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300', // Cache for 5 minutes
      },
    })
  }

  try {
    const supabase = getSupabaseClient()
    
    // Check if query looks like a zip code (5 digits)
    const isZipCode = /^\d{5}$/.test(query.trim())
    
    if (isZipCode) {
      // Handle zip code search using shared utility
      const results = await searchLocationsByZipForAPI(query.trim(), 25)
      return NextResponse.json({ results }, {
        headers: {
          'Cache-Control': 'public, max-age=1800, s-maxage=1800', // Cache for 30 minutes
        },
      })
    }

    // Handle text-based search (name, city, state, description)
    // Use SQL to sort by review_count descending with nulls last, then limit to 10
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, city, state, slug, city_slug, google_rating, description, review_count')
      .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
      .eq('review_status', 'approved')
      .or(`name.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%,description.ilike.%${query}%`)
      .order('review_count', { ascending: false, nullsFirst: false })
      .limit(10)

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ results: [] }, {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=60', // Cache errors for 1 minute
        },
      })
    }

    return NextResponse.json({ results: data || [] }, {
      headers: {
        'Cache-Control': 'public, max-age=1800, s-maxage=1800', // Cache for 30 minutes
      },
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ results: [] }, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=60', // Cache errors for 1 minute
      },
    })
  }
} 