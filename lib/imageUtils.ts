// Utility functions for handling images in social media previews

// =============================================================================
// CLOUDFLARE IMAGES UTILITIES
// =============================================================================

const CLOUDFLARE_ACCOUNT_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_ACCOUNT_HASH || '';

/**
 * Construct a Cloudflare Images delivery URL
 * @param imageId - The Cloudflare image ID
 * @param variant - The variant name (thumbnail, card, detail, public)
 * @returns Full Cloudflare Images URL
 */
export function getCloudflareImageUrl(imageId: string, variant: string = 'public'): string {
  if (!CLOUDFLARE_ACCOUNT_HASH) {
    throw new Error('NEXT_PUBLIC_CLOUDFLARE_IMAGES_ACCOUNT_HASH not configured');
  }
  return `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${imageId}/${variant}`;
}

/**
 * Type for location images from database
 */
export interface LocationImage {
  cf_image_id: string;
  image_type: 'photo' | 'logo' | 'street_view' | 'gallery';
  is_primary: boolean;
}

/**
 * Get image URL for a location, using Cloudflare Images only (no Google fallbacks)
 * @param locationImages - Array of location_images from database
 * @param imageType - Type of image to get (photo, logo, street_view, gallery)
 * @param variant - Cloudflare Images variant to use
 * @returns Image URL or undefined
 */
export function getLocationImageUrl(
  locationImages: LocationImage[] | undefined,
  imageType: 'photo' | 'logo' | 'street_view' | 'gallery',
  variant: 'thumbnail' | 'card' | 'detail' | 'public' = 'public'
): string | undefined {
  // Try to find Cloudflare image
  const cfImage = locationImages?.find(
    img => img.image_type === imageType && img.is_primary
  );

  if (cfImage?.cf_image_id && CLOUDFLARE_ACCOUNT_HASH) {
    return getCloudflareImageUrl(cfImage.cf_image_id, variant);
  }

  return undefined;
}

// =============================================================================
// DETERMINISTIC PLACEHOLDER UTILITIES
// =============================================================================

/**
 * Simple hash function to convert a string to a number
 * @param str - String to hash
 * @returns Hash number
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Brand color palette for gradients
 */
const GRADIENT_COLORS = [
  ['#4F46E5', '#7C3AED'], // Indigo to purple
  ['#0891B2', '#06B6D4'], // Cyan shades
  ['#059669', '#10B981'], // Emerald shades
  ['#DC2626', '#EF4444'], // Red shades
  ['#EA580C', '#F97316'], // Orange shades
  ['#8B5CF6', '#A78BFA'], // Purple shades
  ['#2563EB', '#3B82F6'], // Blue shades
  ['#DB2777', '#EC4899'], // Pink shades
];

/**
 * Generate a deterministic gradient based on location ID
 * @param locationId - Unique location identifier
 * @returns CSS gradient string
 */
export function generatePlaceholderGradient(locationId: string): string {
  const hash = hashString(locationId);
  const colorPair = GRADIENT_COLORS[hash % GRADIENT_COLORS.length];
  const angle = (hash % 8) * 45; // 0, 45, 90, 135, 180, 225, 270, 315

  return `linear-gradient(${angle}deg, ${colorPair[0]}, ${colorPair[1]})`;
} 