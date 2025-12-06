import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, DollarSign, Flame, Calendar, ToolCase, ArrowRight, Star } from 'lucide-react'
import { getSupabaseClient, type Location } from '@/lib/supabase'
import { generateSocialPreview } from '@/components/SocialPreview'
import LocationCard from '@/components/LocationCard'
import { getOpen24HourLocationCount } from '@/lib/stateUtils'
import TopStatesSection from '@/components/TopStatesSection';
import HeroSection from '@/components/HeroSection';
// DISABLED - Re-enable after domain configuration
// import AdPlacement from '@/components/AdPlacement'

export async function generateMetadata(): Promise<Metadata> {
  return generateSocialPreview({
    title: 'Find Dryer Vent Cleaning Services Near Me | Dryer Vent Cleaners',
    description: 'Find professional dryer vent cleaning services across the U.S. Compare services, hours, and ratings. Discover top-rated dryer vent cleaners near you for residential and commercial needs.',
  })
}

async function getFeaturedLocations() {
  try {
    const supabase = getSupabaseClient()

    // Use SQL function to get top 6 locations with weighted scoring
    const { data: topLocations, error: locationsError } = await supabase
      .rpc('get_featured_locations', { limit_count: 6 })

    if (locationsError) {
      console.error('Error fetching featured locations:', locationsError)
      return []
    }

    if (!topLocations || topLocations.length === 0) {
      return []
    }

    // Get hours and images for all featured locations
    const locationIds = topLocations.map((location: Location) => location.id)

    const { data: hours, error: hoursError } = await supabase
      .from('location_hours')
      .select('*')
      .in('location_id', locationIds)

    const { data: images, error: imagesError } = await supabase
      .from('location_images')
      .select('*')
      .in('location_id', locationIds)

    if (hoursError) {
      console.error('Error fetching location hours:', hoursError)
    }

    if (imagesError) {
      console.error('Error fetching location images:', imagesError)
    }

    // Attach hours and images to each location
    const locationsWithHoursAndImages = topLocations.map((location: Location) => ({
      ...location,
      location_hours: hours?.filter(h => h.location_id === location.id) || [],
      location_images: images?.filter(i => i.location_id === location.id) || []
    }))

    return locationsWithHoursAndImages
  } catch (error) {
    console.error('Error fetching featured locations:', error)
    return []
  }
}

async function getStats() {
  try {
    const supabase = getSupabaseClient()
    // Get total locations count
    const { count: totalLocations, error: totalError } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
      .eq('review_status', 'approved')
    if (totalError) {
      console.error('Error fetching total count:', totalError)
      return { totalLocations: 0, totalStates: 0, highRatedCount: 0, highRatedPercent: 0, open24HoursCount: 0 }
    }
    // Get high-rated locations count
    const { count: highRatedCount, error: highRatedError } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
      .eq('review_status', 'approved')
      .gte('google_rating', 4.0)
    if (highRatedError) {
      console.error('Error fetching high-rated count:', highRatedError)
      return { totalLocations: 0, totalStates: 0, highRatedCount: 0, highRatedPercent: 0, open24HoursCount: 0 }
    }
    // Use shared util for open 24 hours count
    const open24HoursCount = await getOpen24HourLocationCount();
    const finalTotalLocations = totalLocations || 0
    const finalHighRatedCount = highRatedCount || 0
    const highRatedPercent = finalTotalLocations > 0 ? Math.round((finalHighRatedCount / finalTotalLocations) * 100) : 0
    return { 
      totalLocations: finalTotalLocations, 
      totalStates: 50, // Hardcode since we expect all states to be covered
      highRatedCount: finalHighRatedCount, 
      highRatedPercent,
      open24HoursCount
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    return { totalLocations: 0, totalStates: 0, highRatedCount: 0, highRatedPercent: 0, open24HoursCount: 0 }
  }
}

export default async function HomePage() {
  const [featuredLocations, stats] = await Promise.all([
    getFeaturedLocations(),
    getStats()
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroSection
        title={<><span>Find Professional Dryer Vent Cleaning</span><br /><span className="text-2xl md:text-3xl font-normal text-gray-700">In the United States</span></>}
        description={"Discover professional dryer vent cleaning services across the United States. Keep your home safe and your dryer running efficiently with certified cleaners."}
      >
        <div className="px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-2">
            <Link
              href="/dryer-vent-cleaning-near-me"
              className="bg-tarawera text-white px-8 py-4 rounded-lg font-semibold shadow-soft hover:shadow-soft-hover hover:bg-primary transition-all duration-300 flex justify-center items-center"
            >
              Find Near Me
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/states"
              className="bg-white border-2 border-tarawera text-tarawera px-8 py-4 rounded-lg font-semibold hover:bg-tarawera hover:text-white transition-colors shadow-soft"
            >
              Explore All States
            </Link>
          </div>
        </div>
      </HeroSection>

      {/* Stats Section with Overlap */}
      <section className="relative z-10 -mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl py-8 px-4 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center border border-gray-100">
            <div>
              <div className="text-4xl font-bold text-tarawera mb-2">{stats.totalLocations}</div>
              <div className="text-gray-600">Dryer Vent Cleaners Nationwide</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">{stats.open24HoursCount}</div>
              <div className="text-gray-600">24-Hour Service Available</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-500 mb-2">{stats.highRatedCount}</div>
              <div className="text-gray-600">4+ Star Rated</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Locations */}
      {featuredLocations.length > 0 && (
        <section id="featured" className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Top-Rated Dryer Vent Cleaning Services
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover the highest-rated dryer vent cleaning services across the country,
                featuring real reviews and curated information.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {featuredLocations.map((location: any) => (
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
                  location_hours={(location as any).location_hours}
                  business_status={location.business_status}
                  street_address={location.street_address}
                  phone={location.phone}
                  website_url={location.website_url}
                />
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Link
                href="/states"
                className="inline-flex items-center bg-tarawera text-white px-6 py-3 rounded-lg font-semibold shadow-soft hover:shadow-soft-hover hover:bg-primary transition-all duration-300"
              >
                Browse Complete Directory
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-primary-light-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Clean Your Dryer Vent?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Regular dryer vent cleaning prevents fires, reduces energy costs, and extends your dryer's lifespan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white border-2 border-red-200 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-md">
                <Flame className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fire Prevention</h3>
              <p className="text-gray-600">
                Lint buildup is a leading cause of house fires. Professional cleaning keeps your home safe.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white border-2 border-tarawera-200 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-md">
                <Calendar className="h-8 w-8 text-tarawera" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Same-Day Service</h3>
              <p className="text-gray-600">
                Many providers offer same-day and emergency services to keep your dryer running safely.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white border-2 border-green-200 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-md">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Energy Savings</h3>
              <p className="text-gray-600">
                Clean vents improve dryer efficiency, reducing energy costs and drying time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ad Placement - DISABLED - Re-enable after domain configuration */}
      {/* <AdPlacement placeholderId={111} /> */}

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about dryer vent cleaning and finding the right service provider.
            </p>
          </div>
          
          <div className="grid gap-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-primary/5">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-4 shadow-md">
                    <Flame className="h-5 w-5 text-white" />
                  </div>
                  Why is dryer vent cleaning important?
                </h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Dryer vent cleaning is essential for home safety and appliance efficiency. Lint and debris accumulate in dryer vents over time, creating a serious fire hazard. Professional cleaning removes this buildup, improves airflow, reduces drying time, and extends the life of your dryer while significantly lowering the risk of dryer fires.
                </p>
                <div className="bg-primary/5 rounded-lg p-4 border-l-4 border-primary">
                  <p className="text-sm text-gray-600">
                    <strong>Did you know?</strong> According to the U.S. Fire Administration, dryer fires cause an estimated 2,900 house fires annually, resulting in $35 million in property damage. Regular vent cleaning is one of the most effective ways to prevent these fires.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-primary-light/5">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center mr-4 shadow-md">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  Where can I find dryer vent cleaning near me?
                </h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Professional dryer vent cleaning services are available across the United States, in most cities and towns. You can use our comprehensive directory to search for certified dryer vent cleaners in your area by entering your city or zip code.
                </p>
                <div className="bg-primary-light/5 rounded-lg p-4 border-l-4 border-primary-light">
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>Quick tip:</strong> We maintain an up-to-date database of dryer vent cleaning services nationwide, including their service areas, availability, pricing, and customer reviews.
                  </p>
                  <Link href="/dryer-vent-cleaning-near-me" className="inline-flex items-center bg-primary-light text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary transition-colors">
                    <MapPin className="h-4 w-4 mr-2" />
                    Find dryer vent cleaning near you
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-tarawera/5">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <div className="w-10 h-10 bg-tarawera rounded-lg flex items-center justify-center mr-4 shadow-md">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  How much does dryer vent cleaning cost?
                </h3>
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Typical Costs:</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-tarawera rounded-full mr-3"></div>
                        Standard service: $100-$170
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-tarawera rounded-full mr-3"></div>
                        Service time: 30-90 minutes
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-tarawera rounded-full mr-3"></div>
                        Includes: Full vent cleaning, inspection, debris removal
                      </li>
                    </ul>
                  </div>
                  <div className="bg-tarawera/5 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Factors Affecting Cost:</h4>
                    <p className="text-sm text-gray-600">
                      Pricing varies based on vent length, number of bends, accessibility, and severity of buildup. Many services offer same-day appointments and emergency services. Commercial properties may have different pricing.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-primary/5">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-4 shadow-md">
                    <ToolCase className="h-5 w-5 text-white" />
                  </div>
                  What services do dryer vent cleaners offer?
                </h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Professional dryer vent cleaning services typically offer comprehensive solutions for both residential and commercial properties. Services include complete vent system cleaning, inspection with camera equipment, debris removal, bird nest removal, and installation of proper venting components.
                </p>
                <div className="bg-primary/5 rounded-lg p-4 border-l-4 border-primary">
                  <h4 className="font-semibold text-gray-900 mb-2">Common Services:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Complete dryer vent cleaning</li>
                    <li>• Video camera inspection</li>
                    <li>• Bird nest & debris removal</li>
                    <li>• Vent repair & replacement</li>
                    <li>• Commercial & multi-unit buildings</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-light-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Find Professional Dryer Vent Cleaning?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Browse our comprehensive directory of dryer vent cleaning services across all 50 states and protect your home today.
          </p>
          <Link
            href="/states"
            className="inline-flex items-center bg-tarawera text-white px-8 py-4 rounded-lg font-semibold shadow-soft hover:shadow-soft-hover hover:bg-primary transition-all duration-300 mx-auto"
          >
            Find Dryer Vent Cleaners Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
      <section className="bg-primary-light-100 py-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white border border-primary-light-200 rounded-full mb-4">
              <Star className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-tarawera mb-4">
              Most Popular States
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore the states with the most dryer vent cleaning services in our directory
            </p>
          </div>
          <TopStatesSection limit={3} />
        </div>
      </section>
    </div>
  )
} 