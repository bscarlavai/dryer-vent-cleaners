// Utility functions for location-based operations

// Calculate distance between two points using Haversine formula
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Get coordinates from zip code using zippopotam.us API
// Note: In-memory caching removed as it doesn't work in Cloudflare Workers (each request = new isolate)
// Rely on Cloudflare's CDN caching and the API's own caching instead
export async function getCoordinatesFromZip(zipCode: string): Promise<{latitude: number, longitude: number} | null> {
  try {
    const fetchOptions: RequestInit & { cf?: any } = {
      headers: {
        'User-Agent': 'DryerVentCleaners/1.0',
      },
    };

    // Add Cloudflare-specific caching if running in Workers runtime (not browser)
    // Check for Cloudflare Workers by looking for caches.default (Workers-specific)
    // Browsers have 'caches' but not 'caches.default'
    const isCloudflareWorker = typeof globalThis !== 'undefined' &&
      'caches' in globalThis &&
      typeof (globalThis as any).caches?.default !== 'undefined';

    if (isCloudflareWorker) {
      fetchOptions.cf = {
        cacheTtl: 86400, // Cache for 24 hours at Cloudflare edge
        cacheEverything: true,
      };
    }

    const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`, fetchOptions);

    if (!response.ok) {
      console.error(`Zippopotam API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const result = {
      latitude: parseFloat(data.places[0].latitude),
      longitude: parseFloat(data.places[0].longitude)
    };

    return result;
  } catch (error) {
    console.error('Error getting coordinates from zip:', error);
    return null;
  }
}

// Search locations by zip code with distance calculation using locations_within_radius RPC
export async function searchLocationsByZip(zipCode: string, radiusMiles: number = 25) {
  try {
    const coords = await getCoordinatesFromZip(zipCode)
    if (!coords) return []

    const { getSupabaseClient } = await import('./supabase')
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .rpc('locations_within_radius', {
        search_lat: coords.latitude,
        search_lng: coords.longitude,
        radius_miles: radiusMiles
      })

    if (error) {
      console.error('Error fetching locations:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
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
      return data
    }

    // Attach images to each location
    const locationsWithImages = data.map((location: any) => ({
      ...location,
      location_images: images?.filter((img: any) => img.location_id === location.id) || []
    }))

    return locationsWithImages
  } catch (error) {
    console.error('Error searching locations by zip:', error)
    return []
  }
}

// Search locations by zip code for API responses (returns simplified data) using locations_within_radius RPC
export async function searchLocationsByZipForAPI(zipCode: string, radiusMiles: number = 25) {
  try {
    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
    });

    const coordsPromise = getCoordinatesFromZip(zipCode);
    const coords = await Promise.race([coordsPromise, timeoutPromise]);
    
    if (!coords) return []

    const { getSupabaseClient } = await import('./supabase')
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .rpc('locations_within_radius', {
        search_lat: coords.latitude,
        search_lng: coords.longitude,
        radius_miles: radiusMiles
      })

    if (error) {
      console.error('Error fetching locations:', error)
      return []
    }

    // Return first 10 results and remove coordinates/distance from API response
    return (data || [])
      .slice(0, 10)
      .map((location: any) => {
        const { latitude, longitude, distance_miles, ...result } = location
        return result
      })
  } catch (error) {
    console.error('Error searching locations by zip:', error)
    return []
  }
}

// Search locations by latitude/longitude with distance calculation using locations_within_radius RPC
export async function searchLocationsByLatLng(lat: number, lng: number, radiusMiles: number = 25, excludeIds: string[] = []) {
  try {
    const { getSupabaseClient } = await import('./supabase')
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .rpc('locations_within_radius', {
        search_lat: lat,
        search_lng: lng,
        radius_miles: radiusMiles,
        exclude_ids: excludeIds
      })

    if (error) {
      console.error('Error fetching locations:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
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
      return data
    }

    // Attach images to each location
    const locationsWithImages = data.map((location: any) => ({
      ...location,
      location_images: images?.filter((img: any) => img.location_id === location.id) || []
    }))

    return locationsWithImages
  } catch (error) {
    console.error('Error searching locations by lat/lng:', error)
    return []
  }
} 