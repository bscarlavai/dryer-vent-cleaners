import Script from 'next/script'
import type { BusinessHour } from '@/lib/timeUtils'

interface StructuredDataProps {
  type: 'website' | 'organization' | 'localBusiness' | 'breadcrumbList'
  data: Record<string, unknown>
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data
  }

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

// Website structured data for homepage
export function WebsiteStructuredData() {
  const data = {
    name: 'Dryer Vent Cleaners',
    description: 'Discover professional dryer vent cleaning services across the United States. Find certified dryer vent cleaners, residential and commercial services near you.',
    url: 'https://www.dryerventcleaners.co'
  }

  return <StructuredData type="website" data={data} />
}

// Organization structured data
export function OrganizationStructuredData() {
  const data = {
    url: 'https://www.dryerventcleaners.co',
    logo: 'https://www.dryerventcleaners.co/logo.png',
    sameAs: [
      'https://twitter.com/dryerventcleaners',
      'https://facebook.com/dryerventcleaners'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'hello@dryerventcleaners.co'
    }
  }

  return <StructuredData type="organization" data={data} />
}

interface LocationForStructuredData {
  name: string;
  description?: string;
  phone?: string;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  google_rating?: number;
  review_count?: number;
  price_level?: string;
  location_hours?: BusinessHour[];
  photo_url?: string;
  website_url?: string;
  amenities?: any[];
  user_rating?: number;
  user_review_count?: number;
}

export function LocalBusinessStructuredData({ location }: { location: LocationForStructuredData }) {
  const data = {
    name: location.name,
    url: location.website_url,
    telephone: location.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: location.street_address,
      addressLocality: location.city,
      addressRegion: location.state,
      postalCode: location.postal_code,
      addressCountry: location.country === 'United States of America' ? 'US' : location.country
    },
    geo: location.latitude && location.longitude ? {
      '@type': 'GeoCoordinates',
      latitude: location.latitude,
      longitude: location.longitude
    } : undefined,
    aggregateRating: (location.user_review_count && location.user_review_count > 0) ? {
      '@type': 'AggregateRating',
      ratingValue: `${location.user_rating}%`,
      reviewCount: location.user_review_count,
    } : undefined,
    priceRange: location.price_level,
    openingHoursSpecification: getOpeningHoursSpecification(location.location_hours || []),
    image: location.photo_url,
    amenityFeature: location.amenities ? location.amenities.map(a => ({
      '@type': 'LocationFeatureSpecification',
      name: a.amenity_name,
      value: true
    })) : []
  }

  return <StructuredData type="localBusiness" data={data} />
}

// Breadcrumb structured data
export function BreadcrumbStructuredData({ items }: { items: Array<{ name: string; url: string }> }) {
  const data = {
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }

  return <StructuredData type="breadcrumbList" data={data} />
}

// Helper function to format opening hours for structured data
function getOpeningHoursSpecification(hours: BusinessHour[]): Array<{
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string;
  opens: string;
  closes: string;
}> {
  const dayMap = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];
  return hours
    .filter(h => !h.is_closed)
    .map(h => ({
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": dayMap[h.day_of_week - 1],
      "opens": to24Hour(h.open_time) || "",
      "closes": to24Hour(h.close_time) || ""
    }));
}

// Helper to convert "10:00 AM" to "10:00"
function to24Hour(timeStr: string | undefined): string | undefined {
  if (!timeStr) return undefined;
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':');
  if (modifier === 'PM' && hours !== '12') hours = String(Number(hours) + 12);
  if (modifier === 'AM' && hours === '12') hours = '00';
  return `${hours.padStart(2, '0')}:${minutes}`;
}
