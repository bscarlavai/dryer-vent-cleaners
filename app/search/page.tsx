import { Metadata } from 'next'
import { MapPin, Search as SearchIcon, Globe } from 'lucide-react'
import { getLocations } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { generateSocialPreview } from '@/components/SocialPreview'
import LocationCard from '@/components/LocationCard'
import { searchLocationsByZip } from '@/lib/locationUtils'
import AdPlacement from '@/components/AdPlacement'

interface PageProps {
  searchParams: {
    q?: string
    location?: string
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const social = generateSocialPreview({
    title: 'Search Results | Dojangs.com',
    description: 'Search for taekwondo schools by name, city, or state. Compare amenities, hours, and ratings.',
  })
  return {
    ...social,
    alternates: {
      canonical: 'https://www.dojangs.com/search',
    },
  }
}

async function searchLocations(query: string, location?: string) {
  try {
    // Check if query looks like a zip code (5 digits)
    const isZipCode = /^\d{5}$/.test(query.trim())
    
    if (isZipCode) {
      // Handle zip code search using shared utility
      const results = await searchLocationsByZip(query.trim(), 25)
      return results || []
    }

    let searchQuery = getLocations()
      .order('review_count', { ascending: false, nullsFirst: false })

    if (query && location) {
      // Search in both query and location
      searchQuery = searchQuery.or(
        `name.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%,description.ilike.%${query}%,name.ilike.%${location}%,city.ilike.%${location}%,state.ilike.%${location}%`
      )
    } else if (query) {
      // Search only in query
      searchQuery = searchQuery.or(
        `name.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%,description.ilike.%${query}%`
      )
    } else if (location) {
      // Search only in location
      searchQuery = searchQuery.or(
        `name.ilike.%${location}%,city.ilike.%${location}%,state.ilike.%${location}%`
      )
    } else {
      // No search terms, return empty
      return []
    }

    const { data, error } = await searchQuery.limit(25)

    if (error) {
      console.error('Search error:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q: query, location } = searchParams
  
  if (!query && !location) {
    notFound()
  }

  const locations = await searchLocations(query || '', location)
  const searchTerm = query || location || ''

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-grow flex flex-col">
        {/* Hero Section */}
        <section className="bg-primary-light-100 pt-20 pb-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                Search Taekwondo Schools
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Find taekwondo schools by name, city, state, or zip code. Compare amenities, hours, and ratings to discover the best dojangs.
              </p>
            </div>
          </div>
        </section>
        {/* Overlap Card for Search Input */}
        <section className="relative z-10 -mt-8 mb-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-xl py-8 px-4 md:px-12 border border-gray-100 flex flex-col items-center">
              <form
                action="/search"
                method="get"
                className="w-full flex flex-col sm:flex-row gap-4 items-stretch justify-center"
              >
                <input
                  type="text"
                  name="q"
                  defaultValue={query || ''}
                  placeholder="Search by name, city, state, or zip code..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tarawera focus:border-transparent text-lg placeholder-gray-500"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto border-2 border-tarawera bg-white text-tarawera px-8 py-3 rounded-lg font-semibold transition-colors hover:bg-tarawera hover:text-white flex items-center justify-center text-lg whitespace-nowrap group"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        </section>
        {/* Results Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="mb-8">
            <p className="text-lg text-gray-600 text-center">
              {locations.length > 0
                ? `Found ${locations.length} taekwondo school${locations.length === 1 ? '' : 's'} for "${searchTerm}"`
                : `No taekwondo schools found for "${searchTerm}"`}
            </p>
          </div>
          {locations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {locations.map((location: any) => (
                <LocationCard
                  key={location.id}
                  id={location.id}
                  name={location.name}
                  city={location.city}
                  state={location.state}
                  slug={location.slug}
                  city_slug={location.city_slug}
                  description={location.description}
                  google_rating={location.google_rating}
                  review_count={location.review_count}
                  photo_url={location.photo_url}
                  location_images={location.location_images}
                  location_hours={location.location_hours}
                  business_status={location.business_status}
                  street_address={location.street_address}
                  phone={location.phone}
                  website_url={location.website_url}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">No taekwondo schools found</div>
              <p className="text-gray-600">
                We couldn't find any taekwondo schools matching "{searchTerm}". Try searching with different terms or browse by state.
              </p>
            </div>
          )}
        </section>

        {/* Ad Placement - After search results */}
        <AdPlacement placeholderId={112} />
      </div>
      {/* How to Search Effectively Section */}
      <section className="bg-primary-light-100 py-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-tarawera mb-4">How to Get the Most Out of Your Search</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              Find the perfect taekwondo school by searching for a city, zip code, or dojang name.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white border border-primary-light-200 rounded-full flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Search by Location</h3>
              <p className="text-gray-600 text-base">
                Enter a city, state name, or zip code to find taekwondo schools in that area.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white border border-primary-light-200 rounded-full flex items-center justify-center mb-4">
                <SearchIcon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Search by Name or Feature</h3>
              <p className="text-gray-600 text-base">
                Search for specific dojang names, keywords, or features—like "taekwondo", "martial arts", "kids classes", or "adult programs"—to find locations that match your needs.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white border border-primary-light-200 rounded-full flex items-center justify-center mb-4">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Explore State Directory</h3>
              <p className="text-gray-600 text-base">
                Can't find what you're looking for? <a href="/states" className="text-tarawera font-semibold hover:underline">Browse our complete directory by state {'>'}</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 