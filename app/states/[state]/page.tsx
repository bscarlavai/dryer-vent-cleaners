import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Heart, ArrowRight, Coffee } from 'lucide-react'
import { getLocations } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { generateSocialPreview } from '@/components/SocialPreview'
import LocationCard from '@/components/LocationCard'
// @ts-ignore
import slugify from '@/lib/slugify'
import JumpToAutocomplete from '@/components/JumpToAutocomplete'
import HeroSection from '@/components/HeroSection';

interface PageProps {
  params: {
    state: string
  }
}

// Helper function to clean URLs consistently
function cleanUrl(url: string): string {
  if (!url) return ''
  
  // Remove protocol
  let cleaned = url.replace(/^https?:\/\//, '')
  
  // Remove www
  cleaned = cleaned.replace(/^www\./, '')
  
  // Remove trailing slash
  cleaned = cleaned.replace(/\/$/, '')
  
  return cleaned
}

// Helper function to convert slug to proper state name
function slugToStateName(slug: string): string {
  // Common words that should remain lowercase in state names
  const lowercaseWords = ['of', 'the', 'and', 'in', 'on', 'at', 'to', 'for', 'with', 'by']
  
  return slug
    .split('-')
    .map((word, index) => {
      // Always capitalize the first word
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1)
      }
      // Keep common words lowercase, capitalize others
      if (lowercaseWords.includes(word.toLowerCase())) {
        return word.toLowerCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

function truncate(str: string, maxLength: number) {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).replace(/\s+\S*$/, '') + '…';
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locations = await getLocations({ state: params.state })
  const firstLocation = locations && Array.isArray(locations.data) && locations.data.length > 0 ? locations.data[0] : null
  const image = firstLocation && firstLocation.photo_url ? firstLocation.photo_url : null
  const stateName = firstLocation ? firstLocation.state : params.state;

  const social = generateSocialPreview({
    title: `${stateName} Dryer Vent Cleaning`,
    description: `Find professional dryer vent cleaning services in ${stateName}. Compare locations, hours, reviews, and more.`,
    image,
    url: `https://www.dryerventcleaners.co/states/${params.state}`,
  })

  return {
    ...social,
    alternates: {
      canonical: `https://www.dryerventcleaners.co/states/${params.state}`,
    },
  }
}

async function getLocationsByState(stateSlug: string) {
  try {
    const stateName = slugToStateName(stateSlug)

    // Get locations with location_images included
    const { data, error } = await getLocations({ state: stateSlug })

    if (error) {
      console.error('Error fetching locations:', error)
      return {}
    }

    // Group by city
    const locationsByCity = (data || []).reduce((acc: Record<string, any[]>, location: any) => {
      const city = location.city
      if (!acc[city]) {
        acc[city] = []
      }
      acc[city].push(location)
      return acc
    }, {})

    return locationsByCity
  } catch (error) {
    console.error('Error fetching locations:', error)
    return {}
  }
}

export default async function StatePage({ params }: PageProps) {
  const stateSlug = params.state
  const stateName = slugToStateName(stateSlug)

  const locationsByCity = await getLocationsByState(stateSlug)

  if (Object.keys(locationsByCity).length === 0) {
    notFound()
  }

  // Get total locations count
  const totalLocations = Object.values(locationsByCity as Record<string, any[]>).reduce((sum: number, cityLocations: any[]) => sum + cityLocations.length, 0)

  // Get top cities for content (sorted alphabetically)
  const sortedCities = Object.keys(locationsByCity).sort()
  const topCitiesArr = sortedCities.slice(0, 5)
  const topCities = topCitiesArr.join(', ')
  const cityCount = Object.keys(locationsByCity).length
  const otherCitiesCount = cityCount - topCitiesArr.length

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Hero Section - full-width, no card, with breadcrumbs inside */}
      <HeroSection
        title={`Dryer Vent Cleaning Services in ${stateName}`}
        description={`Explore ${totalLocations} professional dryer vent cleaning services across ${stateName} - from residential to commercial specialists. Whether you need routine maintenance or emergency service, find certified cleaners who can keep your home safe and your dryer running efficiently.`}
        breadcrumbs={
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/states" className="hover:text-primary transition-colors">
                States
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 font-medium">{stateName}</li>
          </ol>
        }
      />
      {/* Overlap Feature Section - like stats overlap on homepage/states */}
      <section className="relative z-10 -mt-8 mb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl py-8 px-4 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center border border-gray-100">
            <div>
              <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Statewide Coverage</h3>
              <p className="text-gray-600">
                {otherCitiesCount > 0
                  ? `Check out dryer vent cleaning services in ${topCities} and ${otherCitiesCount} other cities — find your local cleaner in ${stateName}!`
                  : `Check out dryer vent cleaning services in ${topCities} — find your local cleaner in ${stateName}!`}
              </p>
            </div>
            <div>
              <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Verified Listings</h3>
              <p className="text-gray-600">
                All {totalLocations} dryer vent cleaning services have been verified with accurate contact info, hours, and service details.
              </p>
            </div>
            <div>
              <div className="bg-tarawera/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Coffee className="h-8 w-8 text-tarawera" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Certified Professionals</h3>
              <p className="text-gray-600">
                Whether you need routine maintenance or emergency service, find the right dryer vent cleaner for your needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* City Navigation */}
        {Object.keys(locationsByCity).length > 1 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 text-left">Jump to City</h2>
            <div className="w-full max-w-md">
              <JumpToAutocomplete
                items={Object.keys(locationsByCity).sort().map(city => ({
                  label: `${city} (${locationsByCity[city].length})`,
                  anchor: `city-${slugify(city)}`
                }))}
                placeholder="Type a city name..."
                className="w-full"
              />
            </div>
          </div>
        )}
        <div>
          {sortedCities.map((city) => (
            <div key={city} id={`city-${slugify(city)}`} className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <MapPin className="h-6 w-6 text-primary mr-2" />
                <Link
                  href={`/cities/${slugify(city)}-${stateSlug}`}
                  className="text-primary font-semibold hover:underline hover:text-tarawera transition-colors flex items-center gap-1"
                >
                  {city}
                  <ArrowRight className="h-4 w-4 text-primary" />
                </Link>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {locationsByCity[city].map((location: any) => (
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
            </div>
          ))}
        </div>
      </div>
      {/* Back to All States Button - always at the bottom, visually separated */}
      <div className="w-full text-center py-6 bg-transparent">
        <Link
          href="/states"
          className="inline-flex items-center bg-primary text-white px-6 py-3 rounded-lg font-semibold shadow-soft hover:shadow-soft-hover hover:bg-primary/90 transition-all duration-300"
        >
          ← Back to All States
        </Link>
      </div>
    </div>
  )
} 