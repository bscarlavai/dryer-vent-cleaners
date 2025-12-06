import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Singleton instance (lazy-loaded)
let supabaseClient: SupabaseClient | null = null

// Helper function to get supabase client safely (lazy initialization)
export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
}

// Types for our data
export interface Location {
  id: string // This is now a UUID (primary key)
  name: string
  slug: string
  website_url?: string
  phone?: string
  email?: string
  street_address?: string
  city: string
  state: string
  postal_code?: string
  country: string
  latitude?: number
  longitude?: number
  description?: string
  business_type?: string
  business_status?: string
  google_rating?: number
  review_count?: number
  working_hours?: any
  price_level?: string
  photo_url?: string
  logo_url?: string
  street_view_url?: string
  google_place_id?: string // This is now a separate field
  google_id?: string
  claimed_status?: 'unclaimed' | 'pending' | 'claimed'
  reviews_tags?: string[]
  reservation_urls?: string[]
  booking_appointment_url?: string
  menu_url?: string
  order_urls?: string[]
  location_url?: string
  created_at: string
  updated_at: string
  review_status: 'pending' | 'approved' | 'rejected'
}

export interface LocationAmenity {
  id: string
  location_id: string
  amenity_name: string
  amenity_category: string
}

export interface LocationHours {
  id: string
  location_id: string
  day_of_week: number
  open_time?: string
  close_time?: string
  is_closed: boolean
}

export interface LocationClaim {
  id: string
  location_id: string
  name: string
  email: string
  created_at: string
}

export interface LocationFeedback {
  id: string;
  location_id: string;
  feedback: string;
  email?: string | null;
  created_at?: string | null;
}

// Common function to get locations with business status filter and optional filters
export function getLocations(filters?: { state?: string; city?: string; }) {
  const supabase = getSupabaseClient()
  let query = supabase
    .from('locations')
    .select('*, location_images(cf_image_id, image_type, is_primary)')
    .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
    .eq('review_status', 'approved')

  if (filters?.state) {
    // Convert slug to title case for state
    const stateName = filters.state.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    query = query.ilike('state', `%${stateName}%`)
  }
  if (filters?.city) {
    // Use city_slug for city filtering
    query = query.eq('city_slug', filters.city)
  }

  return query
} 