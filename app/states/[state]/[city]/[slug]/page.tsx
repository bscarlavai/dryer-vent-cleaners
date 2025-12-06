import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateSocialPreview } from '@/components/SocialPreview'
import LocationPageClient from '@/components/LocationPageClient'
import { getSupabaseClient } from '@/lib/supabase'
// @ts-ignore
import slugify from '@/lib/slugify'
import { MapPin } from 'lucide-react'
import { getLocationImageUrl, type LocationImage } from '@/lib/imageUtils'

interface PageProps {
  params: {
    state: string
    city: string
    slug: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const location = await getLocationBySlugStateAndCity(params.slug, params.state, params.city)

  if (!location) {
    return generateSocialPreview({
      title: 'Dryer Vent Cleaning Service Not Found',
      description: 'The requested dryer vent cleaning service could not be found.',
    })
  }

  const imageUrl = getLocationImageUrl(
    location.location_images as LocationImage[],
    'photo',
    'public'
  )

  const social = generateSocialPreview({
    title: `${location.name} - ${location.city} Dryer Vent Cleaning Service`,
    description: `${location.name} dryer vent cleaning service in ${location.city}, ${location.state}. Get the location's hours, reviews, amenities, directions, and contact information.`,
    image: imageUrl,
    url: `https://www.dryerventcleaners.co/states/${params.state}/${params.city}/${params.slug}`,
    type: 'article',
  })

  return {
    ...social,
    alternates: {
      canonical: `https://www.dryerventcleaners.co/states/${params.state}/${params.city}/${params.slug}`,
    },
  }
}

export default async function LocationPage({ params }: PageProps) {
  const location = await getLocationBySlugStateAndCity(params.slug, params.state, params.city)

  if (!location) {
    notFound()
  }

  return (
    <>
      <LocationPageClient location={location} params={params} />
      {/* Full-width CTA Section */}
      {location && (
        <section className="py-16 bg-primary-light-100 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white border border-primary-light-200 rounded-full mb-6">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              More Dryer Vent Cleaning Services in {location.state}
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Discover other amazing dryer vent cleaning services and services in {location.state}
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center mt-8">
              <a
                href={`/states/${params.state}`}
                className="inline-flex items-center justify-center bg-tarawera text-white px-8 py-4 rounded-lg font-semibold shadow-soft hover:shadow-soft-hover hover:bg-primary transition-all duration-300 w-full md:w-auto"
              >
                <MapPin className="h-5 w-5 mr-2" />
                Browse All Dryer Vent Cleaners in {location.state}
              </a>
              <a
                href="/states"
                className="inline-flex items-center justify-center bg-white border-2 border-tarawera text-tarawera px-8 py-4 rounded-lg font-semibold hover:bg-tarawera hover:text-white transition-all duration-300 w-full md:w-auto"
              >
                Explore All States
              </a>
            </div>
          </div>
        </section>
      )}
    </>
  )
}

async function getLocationBySlugStateAndCity(slug: string, state: string, city: string) {
  try {
    const supabase = getSupabaseClient()
    const citySlugified = slugify(city);
    const stateSlugified = slugify(state);
    // Fetch only candidates for this city_slug, state, and visible/operational status
    const { data, error } = await supabase
      .from('locations')
      .select(`*, location_amenities(amenity_name, amenity_category), location_hours(day_of_week, open_time, close_time, is_closed), location_images(cf_image_id, image_type, is_primary)`)
      .eq('review_status', 'approved')
      .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
      .eq('city_slug', citySlugified)
      .ilike('state', `%${stateSlugified.replace(/-/g, ' ')}%`);
    if (error) {
      console.error('Error fetching locations:', error)
      return null
    }
    // Find the exact match for this slug, state, and city using city_slug
    const location = data?.find(location => {
      return (
        location.slug === slug &&
        slugify(location.state) === stateSlugified &&
        location.city_slug === citySlugified
      )
    })
    if (!location) {
      console.log('No location found for:', { slug, state, city })
    }
    return location || null
  } catch (error) {
    console.error('Error fetching locations:', error)
    return null
  }
}