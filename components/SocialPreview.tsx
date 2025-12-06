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
  image = '/dojangs.png', // Default to site logo
  url = 'https://www.dojangs.com',
  type = 'website'
}: SocialPreviewProps): Metadata {
  // Use provided image or fallback to site logo
  const imageToUse = image || '/dojangs.png'

  // Ensure image URL is absolute
  const imageUrl = imageToUse.startsWith('http') ? imageToUse : `https://www.dojangs.com${imageToUse}`
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Dojangs',
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
      creator: '@dojangs', // Optional: your Twitter handle
    },
  }
} 