import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '../../../lib/supabase'

// Server-side zip to coordinates lookup (avoids CORS issues on mobile)
async function getCoordinatesFromZip(zipCode: string): Promise<{latitude: number, longitude: number} | null> {
  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`, {
      headers: {
        'User-Agent': 'DryerVentCleaners/1.0',
      },
    })

    if (!response.ok) {
      console.error(`Zippopotam API error: ${response.status}`)
      return null
    }

    const data = await response.json()
    return {
      latitude: parseFloat(data.places[0].latitude),
      longitude: parseFloat(data.places[0].longitude)
    }
  } catch (error) {
    console.error('Error getting coordinates from zip:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const zip = searchParams.get('zip')
  const radiusParam = searchParams.get('radius')
  const radius = radiusParam ? parseInt(radiusParam) : 25

  if (!zip || !/^\d{5}$/.test(zip.trim())) {
    return NextResponse.json({ error: 'Invalid zip code', results: [] }, { status: 400 })
  }

  try {
    // Get coordinates from zip (server-side, no CORS issues)
    const coords = await getCoordinatesFromZip(zip.trim())

    if (!coords) {
      return NextResponse.json({ error: 'Could not find coordinates for zip code', results: [] }, { status: 404 })
    }

    const supabase = getSupabaseClient()

    // Call the RPC function
    const { data, error } = await supabase
      .rpc('locations_within_radius', {
        search_lat: coords.latitude,
        search_lng: coords.longitude,
        radius_miles: radius
      })

    if (error) {
      console.error('Error fetching locations:', error)
      return NextResponse.json({ error: 'Database error', results: [] }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ results: [] })
    }

    // Fetch location_images for all returned locations
    const locationIds = data.map((loc: any) => loc.id)
    const { data: images, error: imagesError } = await supabase
      .from('location_images')
      .select('*')
      .in('location_id', locationIds)

    if (imagesError) {
      console.error('Error fetching location images:', imagesError)
      // Return locations without images if fetch fails
      return NextResponse.json({ results: data })
    }

    // Attach images to each location
    const locationsWithImages = data.map((location: any) => ({
      ...location,
      location_images: images?.filter((img: any) => img.location_id === location.id) || []
    }))

    return NextResponse.json({ results: locationsWithImages })

  } catch (error) {
    console.error('Nearby search error:', error)
    return NextResponse.json({ error: 'Server error', results: [] }, { status: 500 })
  }
}
