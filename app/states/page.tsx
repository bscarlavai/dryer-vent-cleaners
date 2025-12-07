import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Star, Heart } from 'lucide-react'
import { generateSocialPreview } from '@/components/SocialPreview'
import { getStatesWithLocations, getOpen24HourLocationCount } from '@/lib/stateUtils'
import TopStatesCard from '@/components/TopStatesCard'
import { getSupabaseClient } from '@/lib/supabase'

export async function generateMetadata(): Promise<Metadata> {
  const social = generateSocialPreview({
    title: 'Dryer Vent Cleaning Services by State | Find Dryer Vent Cleaners',
    description: 'Browse professional dryer vent cleaning services by state. Compare services, hours, and ratings. Discover certified dryer vent cleaners across all 50 states.',
    url: 'https://www.dryerventcleaners.co/states',
  })
  return {
    ...social,
    alternates: {
      canonical: 'https://www.dryerventcleaners.co/states',
    },
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

export default async function StatesPage() {
  const [states, stats] = await Promise.all([
    getStatesWithLocations(),
    getStats()
  ])
  const sortedStates = [...states].sort((a, b) => b.locationCount - a.locationCount)
  const topStates = sortedStates.slice(0, 3)
  const alphaStates = [...states].sort((a, b) => a.name.localeCompare(b.name))

  // Group all states by first letter
  const groupedStates = alphaStates.reduce((acc, state) => {
    const firstLetter = state.name.charAt(0)
    if (!acc[firstLetter]) {
      acc[firstLetter] = []
    }
    acc[firstLetter].push(state)
    return acc
  }, {} as { [key: string]: typeof alphaStates })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-primary-light-100 pt-20 pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Dryer Vent Cleaning Services by State
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
              From California to New York, find professional dryer vent cleaning services across all 50 states.
              Whether you need residential service, commercial cleaning, or emergency appointments,
              we've got you covered with certified dryer vent cleaners nationwide.
            </p>
          </div>
        </div>
      </section>

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

      {/* Quick Navigation & All States Section */}
      {Object.keys(groupedStates).length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              All States with Dryer Vent Cleaning Services
            </h2>
            {/* Quick Navigation */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-primary-light-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Navigation</h3>
              <div className="flex flex-wrap gap-2">
                {Object.keys(groupedStates).sort().map((letter) => (
                  <a
                    key={letter}
                    href={`#letter-${letter}`}
                    className="bg-primary-light-100 text-primary px-3 py-2 rounded-lg text-sm font-semibold border border-primary-light-200 hover:bg-primary-light-200 hover:text-tarawera transition-colors"
                  >
                    {letter}
                  </a>
                ))}
              </div>
            </div>
            {/* Alphabetical Groups */}
            <div className="space-y-8">
              {Object.keys(groupedStates).sort().map((letter) => (
                <div key={letter} id={`letter-${letter}`} className="mb-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                    <MapPin className="h-6 w-6 text-primary mr-2" />
                    {letter}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {groupedStates[letter].map((state) => (
                      <Link
                        key={state.slug}
                        href={`/states/${state.slug}`}
                        className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 border border-gray-200 hover:border-tarawera-300 transform hover:-translate-y-1 flex flex-col items-center"
                      >
                        <div className="flex items-center w-full justify-center mb-2">
                          <span className="bg-primary-light-100 p-2 rounded-full mr-2 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-primary" />
                          </span>
                          <span className="text-lg font-semibold text-tarawera">{state.name}</span>
                        </div>
                        <div className="text-center w-full">
                          <div className="text-2xl font-bold text-tarawera mb-1">{state.locationCount}</div>
                          <div className="text-sm text-manatee mb-3">{state.locationCount === 1 ? 'Dryer Vent Cleaner' : 'Dryer Vent Cleaners'}</div>
                          <div className="bg-tarawera text-white w-full px-4 py-2 rounded-lg font-medium hover:bg-tarawera-200 transition-colors">
                            Explore Services →
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Most Popular States at Bottom */}
      {topStates.length > 0 && (
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topStates.map((state, index) => (
                <TopStatesCard
                  key={state.slug}
                  name={state.name}
                  count={state.locationCount}
                  rank={index + 1}
                  href={`/states/${state.slug}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {states.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-primary-light-100 rounded-lg shadow-md p-8 max-w-md mx-auto border border-primary-light-200">
            <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No dryer vent cleaning services found</h3>
            <p className="text-gray-600">Check back soon as we're constantly adding new service providers!</p>
          </div>
        </div>
      )}
    </div>
  )
} 