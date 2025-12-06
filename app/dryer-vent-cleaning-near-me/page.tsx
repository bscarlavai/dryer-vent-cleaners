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
        title: `Taekwondo Schools Near ${zip} | Dojangs`,
        description: `Explore taekwondo schools and dojangs near ${zip}. Get directions, hours, and contact details for local taekwondo classes.`,
        image,
        url: `https://www.dojangs.com/self-service-car-wash-near-me?zip=${zip}`,
      })
      return {
        ...social,
        alternates: {
          canonical: `https://www.dojangs.com/self-service-car-wash-near-me?zip=${zip}`,
        },
      }
    } catch (error) {
      // Fallback to default metadata
    }
  }
  // Default metadata for taekwondo-near-me page
  const social = generateSocialPreview({
    title: 'Taekwondo Near Me | Find Taekwondo Classes Near Me',
    description: 'Explore taekwondo schools and dojangs in your area. Compare amenities, hours, and ratings. Find top-rated taekwondo classes open near you.',
    url: 'https://www.dojangs.com/self-service-car-wash-near-me',
  })
  return {
    ...social,
    alternates: {
      canonical: 'https://www.dojangs.com/self-service-car-wash-near-me',
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