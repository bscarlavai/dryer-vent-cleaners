"use client"

import React from 'react'
import {
  Award,
  Baby,
  CalendarCheck,
  Check,
  Calendar,
  Calculator,
  Heart,
  Home,
  Accessibility,
  Shield,
  SquareParking,
  Star,
  Truck,
  Wifi,
  CreditCard
} from 'lucide-react'

const POPULAR_AMENITIES = [
  { label: 'Onsite Services', key: 'Onsite Services', icon: <Home className="h-5 w-5" /> },
  { label: 'Online Estimates', key: 'Online Estimates', icon: <Calculator className="h-5 w-5" /> },
  { label: 'Wheelchair Accessible', key: 'Wheelchair Accessible', icon: <Accessibility className="h-5 w-5" /> },
  { label: 'Appointment Required', key: 'Appointment Required', icon: <CalendarCheck className="h-5 w-5" /> },
  { label: 'Veteran-Owned', key: 'Veteran-Owned', icon: <Shield className="h-5 w-5" /> },
  { label: 'Women-Owned', key: 'Women-Owned', icon: <Award className="h-5 w-5" /> },
  { label: 'LGBTQ+ Friendly', key: 'LGBTQ+ Friendly', icon: <Heart className="h-5 w-5" /> },
  { label: 'Free Parking', key: 'Free Parking', icon: <SquareParking className="h-5 w-5" /> },
  { label: 'Small Business', key: 'Small Business', icon: <Star className="h-5 w-5" /> },
]

interface Props {
  amenitiesByCategory: { [key: string]: string[] }
  sortedCategories: string[]
}

const amenityMatchMap: { [key: string]: string[] } = {
  "Onsite Services": [
    "onsite services", "on-site services", "mobile service", "comes to you"
  ],
  "Online Estimates": [
    "online estimates", "online estimate", "get quote online", "free estimate"
  ],
  "Wheelchair Accessible": [
    "wheelchair accessible", "wheelchair accessible entrance", "wheelchair accessible parking",
    "wheelchair accessible restroom", "wheelchair accessible seating", "accessible"
  ],
  "Appointment Required": [
    "appointment required", "appointments required", "by appointment", "call ahead"
  ],
  "Veteran-Owned": [
    "veteran-owned", "identifies as veteran-owned", "veteran owned"
  ],
  "Women-Owned": [
    "women-owned", "identifies as women-owned", "woman-owned", "female-owned"
  ],
  "LGBTQ+ Friendly": [
    "lgbtq+ friendly", "lgbtq friendly", "transgender safespace", "inclusive"
  ],
  "Free Parking": [
    "free parking", "free parking lot", "free street parking", "on-site parking", "parking available"
  ],
  "Small Business": [
    "small business", "locally owned", "family owned"
  ]
}

// Helper function to get appropriate icon for each category
function getCategoryIcon(category: string) {
  const iconMap: { [key: string]: React.ReactNode } = {
    'Service options': <Truck className="h-5 w-5 text-primary" />,
    'Highlights': <Star className="h-5 w-5 text-primary" />,
    'Offerings': <Award className="h-5 w-5 text-primary" />,
    'Amenities': <Wifi className="h-5 w-5 text-primary" />,
    'Accessibility': <Accessibility className="h-5 w-5 text-primary" />,
    'Crowd': <Heart className="h-5 w-5 text-primary" />,
    'Planning': <Calendar className="h-5 w-5 text-primary" />,
    'Payments': <CreditCard className="h-5 w-5 text-primary" />,
    'Children': <Baby className="h-5 w-5 text-primary" />,
    'Parking': <SquareParking className="h-5 w-5 text-primary" />,
    'Other': <Star className="h-5 w-5 text-primary" />,
  };
  return iconMap[category] || <Star className="h-5 w-5 text-primary" />;
}

export default function AmenitiesSummaryAndDetails({ amenitiesByCategory, sortedCategories }: Props) {
  const [expanded, setExpanded] = React.useState(false)
  // Flatten all amenities for quick lookup
  const allAmenities = React.useMemo(() => Object.values(amenitiesByCategory).flat().map(a => a.toLowerCase()), [amenitiesByCategory])

  function hasAmenity(popularKey: string) {
    const matches = amenityMatchMap[popularKey] || [];
    if (matches.length === 0) {
      console.log(popularKey)
    }
    return allAmenities.some(a => matches.some(m => a.includes(m)))
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8 mb-8">
      <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
          <span className="text-primary font-bold text-lg">★</span>
        </div>
        Amenities & Features
      </h2>
      {/* Summary List - Top Amenities */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...POPULAR_AMENITIES].sort((a, b) => a.label.localeCompare(b.label)).map(({ label, key, icon }) => {
          const available = hasAmenity(key)
          return (
            <div
              key={key}
              className={`flex items-center px-4 py-3 rounded-lg border-2 transition-all ${
                available
                  ? 'bg-primary-50 border-primary-200 shadow-sm'
                  : 'bg-gray-50 border-gray-200 opacity-50'
              }`}
            >
              <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                available ? 'bg-primary-100' : 'bg-gray-200'
              }`}>
                <span className={available ? "text-primary" : "text-gray-400"}>{icon}</span>
              </div>
              <span className={`ml-3 font-semibold flex-1 ${
                available ? "text-tarawera" : "text-gray-400"
              }`}>{label}</span>
              {available && (
                <Check className="ml-2 h-5 w-5 text-primary flex-shrink-0" />
              )}
            </div>
          )
        })}
      </div>
      <button
        className="text-primary font-semibold underline mb-4"
        onClick={() => setExpanded(e => !e)}
        type="button"
      >
        {expanded ? 'Hide all amenities' : 'Show all amenities'}
      </button>
      {expanded && (
        <div className="space-y-8 mt-6">
          {sortedCategories.map((category) => (
            <div key={category} className="border border-primary-200 rounded-xl p-6 bg-gradient-to-br from-primary-50 to-white">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                  {getCategoryIcon(category)}
                </div>
                <h3 className="text-xl font-semibold text-primary">{category}</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {amenitiesByCategory[category].map((amenity: string) => (
                  <div
                    key={amenity}
                    className="flex items-center space-x-2 text-tarawera font-semibold transition-colors"
                  >
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 