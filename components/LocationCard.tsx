import Link from 'next/link';
import { MapPin, Star, ArrowRight, Phone, Globe, BrushCleaning } from 'lucide-react';
import { getLocationImageUrl, generatePlaceholderGradient, type LocationImage } from '@/lib/imageUtils';
import { isBusinessOpen } from '@/lib/timeUtils';
import React from 'react';
import slugify from '@/lib/slugify';

interface LocationCardProps {
  id: string;
  name: string;
  city: string;
  state: string;
  slug: string;
  city_slug?: string;
  description?: string;
  google_rating?: number;
  review_count?: number;
  photo_url?: string;
  location_images?: LocationImage[];
  location_hours?: any[];
  business_status?: string;
  street_address?: string;
  phone?: string;
  website_url?: string;
  className?: string;
  showContact?: boolean;
  distance_miles?: number;
}

function cleanUrl(url: string): string {
  if (!url) return '';
  let cleaned = url.replace(/^https?:\/\//, '');
  cleaned = cleaned.replace(/^www\./, '');
  cleaned = cleaned.replace(/\/$/, '');
  return cleaned;
}

const LocationCard: React.FC<LocationCardProps> = ({
  id,
  name,
  city,
  state,
  slug,
  city_slug,
  description,
  google_rating,
  review_count,
  photo_url,
  location_images,
  location_hours,
  business_status,
  street_address,
  phone,
  website_url,
  className = '',
  showContact = false,
  distance_miles,
}) => {
  // Check for any available image type (street_view, photo, logo)
  const shopImage =
    getLocationImageUrl(location_images, 'street_view', 'card') ||
    getLocationImageUrl(location_images, 'photo', 'card') ||
    getLocationImageUrl(location_images, 'logo', 'card');
  const placeholderGradient = !shopImage ? generatePlaceholderGradient(id) : null;
  const detailsUrl = `/states/${slugify(state)}/${city_slug || slugify(city)}/${slug}`;
  let openStatus: React.ReactNode = null;
  // TODO: Let's not show this for now
  // if (business_status === 'CLOSED_TEMPORARILY') {
  //   openStatus = <span className="text-peach-600 font-medium">Temporarily Closed</span>;
  // } else if (location_hours && state) {
  //   const status = isBusinessOpen(location_hours, state);
  //   openStatus = status.isOpen ? (
  //     <span className="text-green-600 font-medium">Open Now</span>
  //   ) : (
  //     <span className="text-red-600 font-medium">Closed</span>
  //   );
  // }

  // Prevent card navigation when clicking phone/website links
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Link
      href={detailsUrl}
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 group cursor-pointer h-full flex flex-col ${className}`}
      tabIndex={0}
    >
      <div className="relative h-48 overflow-hidden">
        {shopImage ? (
          <>
            <img
              src={shopImage}
              alt={`${name} dryer vent cleaning service in ${city}, ${state}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/10"></div>
          </>
        ) : placeholderGradient ? (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: placeholderGradient }}
          >
            <BrushCleaning className="w-24 h-24 text-white opacity-40" strokeWidth={1.5} />
          </div>
        ) : null}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex-grow">
          <div className="flex items-start justify-between mb-3">
            <p className="text-lg font-semibold text-gray-900 break-words group-hover:text-primary transition-colors">
              {name}
            </p>
          </div>
          <div className="flex items-center text-gray-600 mb-3">
            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-sm">
              {street_address ? street_address : `${city}, ${state}`}
            </span>
          </div>
          {google_rating && (
            <div className="flex items-center mb-3">
              <Star className="h-4 w-4 text-yellow-500 mr-1 fill-current" />
              <span className="text-sm font-medium text-gray-900">
                {google_rating}
              </span>
              {review_count && (
                <span className="text-sm text-gray-600 ml-1">
                  ({review_count} reviews)
                </span>
              )}
            </div>
          )}
          {description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {description}
            </p>
          )}
          {showContact && (
            <div className="space-y-2 text-sm text-gray-600 mb-2">
              {phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <a
                    href={`tel:${phone}`}
                    className="hover:text-primary transition-colors"
                    onClick={stopPropagation}
                  >
                    {phone}
                  </a>
                </div>
              )}
              {website_url && (
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-2 text-gray-400" />
                  <a
                    href={website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="line-clamp-1 hover:text-primary transition-colors"
                    onClick={stopPropagation}
                  >
                    {cleanUrl(website_url)}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-200">
          <span className="flex items-center text-sm text-gray-500">
            {distance_miles !== undefined && (
              <>
                <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                {distance_miles.toFixed(1)} miles away
              </>
            )}
          </span>
          <span className="flex items-center text-sm text-primary font-semibold group-hover:text-primary-light transition-colors">
            View Details <ArrowRight className="ml-1 h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default LocationCard; 