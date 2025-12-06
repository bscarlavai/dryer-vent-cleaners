import { Metadata } from 'next'

interface SocialPreviewProps {
  title: string
  description: string
  image?: string | null
  url?: string
  type?: 'website' | 'article'
}

export function generateSocialPreview({
  title,
  description,
  image = '/dryerventcleaners.png', // Default to site logo
  url = 'https://www.dryerventcleaners.co',
  type = 'website'
}: SocialPreviewProps): Metadata {
  // Use provided image or fallback to site logo
  const imageToUse = image || '/dryerventcleaners.png'

  // Ensure image URL is absolute
  const imageUrl = imageToUse.startsWith('http') ? imageToUse : `https://www.dryerventcleaners.co${imageToUse}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Dryer Vent Cleaners',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: '@dryerventcleaners', // Optional: your Twitter handle
    },
  }
} 