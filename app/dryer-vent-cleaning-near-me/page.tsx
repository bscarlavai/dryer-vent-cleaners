import { Metadata } from 'next'
import { Suspense } from 'react'
import NearMeClient from '@/components/NearMeClient'
import { generateSocialPreview } from '@/components/SocialPreview'
import { getLocations } from '@/lib/supabase'

interface PageProps {
  searchParams: {
    zip?: string
  }
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const zip = searchParams.zip
  
  if (zip) {
    // Try to get locations near this zip code for a more relevant preview
    try {
      const locations = await getLocations({})
      const firstLocation = locations && Array.isArray(locations.data) && locations.data.length > 0 ? locations.data[0] : null
      const image = firstLocation && firstLocation.photo_url ? firstLocation.photo_url : null
      
      const social = generateSocialPreview({
        title: `Dryer Vent Cleaning Near ${zip} | Dryer Vent Cleaners`,
        description: `Find professional dryer vent cleaning services near ${zip}. Get directions, hours, and contact details for local dryer vent cleaners.`,
        image,
        url: `https://www.dryerventcleaners.co/dryer-vent-cleaning-near-me?zip=${zip}`,
      })
      return {
        ...social,
        alternates: {
          canonical: `https://www.dryerventcleaners.co/dryer-vent-cleaning-near-me?zip=${zip}`,
        },
      }
    } catch (error) {
      // Fallback to default metadata
    }
  }
  // Default metadata for dryer-vent-cleaning-near-me page
  const social = generateSocialPreview({
    title: 'Dryer Vent Cleaning Near Me | Find Local Dryer Vent Cleaners',
    description: 'Find professional dryer vent cleaning services in your area. Compare services, hours, and ratings. Find top-rated dryer vent cleaners near you.',
    url: 'https://www.dryerventcleaners.co/dryer-vent-cleaning-near-me',
  })
  return {
    ...social,
    alternates: {
      canonical: 'https://www.dryerventcleaners.co/dryer-vent-cleaning-near-me',
    },
  }
}

export default function NearMePage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-gray-500">Loading...</div>}>
      <NearMeClient />
    </Suspense>
  )
} 