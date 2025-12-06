"use client"

import React from 'react'
import {
  Baby,
  Banknote,
  BrushCleaning,
  Flame,
  CalendarCheck,
  Check,
  Calendar,
  Coffee,
  CreditCard,
  Droplets,
  Fuel,
  Hamburger,
  HandCoins,
  Heart,
  Smartphone,
  SquareParking,
  Star,
  Toilet,
  Users,
  WashingMachine,
  Wifi
} from 'lucide-react'

const POPULAR_AMENITIES = [
  { label: 'Cash Only', key: 'Cash Only', icon: <Banknote className="h-5 w-5" /> },
  { label: 'Mobile Payments', key: 'Mobile Payments', icon: <Smartphone className="h-5 w-5" /> },
  { label: 'Credit Cards', key: 'Credit Cards', icon: <CreditCard className="h-5 w-5" /> },
  { label: 'Vacuums (Free)', key: 'Free Vacuums', icon: <BrushCleaning className="h-5 w-5" /> },
  { label: 'Vacuums (Paid)', key: 'Paid Vacuums', icon: <HandCoins className="h-5 w-5" /> },
  { label: 'Oil Changes', key: 'Oil Changes', icon: <Droplets className="h-5 w-5" /> },
  { label: 'Undercarriage Cleaning', key: 'Undercarriage Cleaning', icon: <Flame className="h-5 w-5" /> },
  { label: 'Towels', key: 'Towels', icon: <WashingMachine className="h-5 w-5" /> },
  { label: 'Appointment Required', key: 'Appointment Required', icon: <CalendarCheck className="h-5 w-5" /> },
  { label: 'Bathroom', key: 'Bathroom', icon: <Toilet className="h-5 w-5" /> },
  { label: 'Drinks', key: 'Drinks', icon: <Coffee className="h-5 w-5" /> },
  { label: 'Food', key: 'Food', icon: <Hamburger className="h-5 w-5" /> },
]

interface Props {
  amenitiesByCategory: { [key: string]: string[] }
  sortedCategories: string[]
}

const amenityMatchMap: { [key: string]: string[] } = {
  "Paid Vacuums": ["car vacuum", "paid vacuums"],
  "Free Vacuums": ["free vacuums"],
  "Oil Changes": ["oil change"],
  "Hand Car Washes": ["hand car wash"],
  "Undercarriage Cleaning": ["undercarriage cleaning"],
  "Towels": ["towels"],
  "Kid-friendly": [
    "kid-friendly", "kid-friendly activities", "kid-friendly hikes", "good for kids", "good for kids birthday",
    "high chairs", "has changing table(s)", "discounts for kids", "family-friendly", "family discount", "kids' menu"
  ],
  "Bathroom": [
    "bathroom", "restroom", "public restroom", "gender-neutral restroom", "nursing room"
  ],
  "WiFi": [
    "wi-fi", "free wi-fi", "wireless internet"
  ],
  "Drinks": [
    "drinks", "coffee", "tea", "great tea selection", "cocktails", "great cocktails", "beer", "great beer selection",
    "wine", "great wine list", "bar onsite", "bar games", "barbecue grill", "alcohol", "hard liquor", "happy hour drinks"
  ],
  "Food": [
    "food", "meals", "lunch", "breakfast", "dinner", "brunch", "dessert", "great dessert", "great bar food", "great coffee",
    "great produce", "great tea selection", "great wine list", "all you can eat", "comfort food", "healthy options",
    "halal food", "vegan options", "vegetarian options", "organic dishes", "organic products", "small plates", "salad bar",
    "prepared foods", "bakery", "cafe", "restaurant", "quick bite", "quick visit", "outside food allowed", "food at bar",
    "free breakfast", "late-night food", "brunch reservations recommended", "dinner reservations recommended",
    "lunch reservations recommended"
  ],
  "Parking": [
    "parking", "free parking", "free parking garage", "free parking lot", "free street parking", "paid parking garage",
    "paid parking lot", "paid street parking", "on-site parking", "valet parking"
  ],
  "Cash Only": ["cash-only"],
  "Mobile Payments": [
    "mobile payments", "nfc mobile payments"
  ],
  "Credit Cards": [
    "credit cards", "accepts credit cards", "debit cards", "nfc mobile payments", "snap/ebt", "card payment"
  ],
  "Reservations": [
    "accepts reservations", "reservations required", "appointments recommended", "appointment required", "appointments only",
    "brunch reservations recommended", "dinner reservations recommended", "lunch reservations recommended", "accepts walk-ins"
  ],
  "Appointment Required": [
    "appointment required", "appointments recommended", "appointments only", "reservations required"
  ],
  "Accessible": [
    "accessible", "braille menu"
  ],
  "Atmosphere": [
    "cozy", "casual", "lively", "quiet", "romantic", "trendy", "upscale", "historic", "fireplace", "rooftop seating", "pool", "swimming pool",
    "volleyball court", "basketball court", "playground", "slides", "picnic tables", "table service", "private dining room", "seating", "stadium seating"
  ],
  "Service": [
    "fast service", "counter service", "dine-in", "takeout", "delivery", "curbside pickup", "drive-through", "no-contact delivery", "in-store pickup",
    "in-store shopping", "same-day delivery", "service guarantee"
  ],
  "Events/Entertainment": [
    "live music", "live performances", "karaoke", "trivia night", "dancing", "bar games", "arcade games", "sports", "theater", "3d movies", "party services", "petting zoo", "offers tours"
  ],
  "Identity/Ownership": [
    "identifies as asian-owned", "identifies as black-owned", "identifies as disabled-owned", "identifies as indigenous-owned", "identifies as latino-owned",
    "identifies as lgbtq+ owned", "identifies as veteran-owned", "identifies as women-owned", "lgbtq+ friendly", "transgender safespace"
  ],
  "Other": [
    "admission fee", "active military discounts", "buys used goods", "gift shop", "flowers", "pharmacy", "trending", "tourists", "locals", "usually a wait",
    "getting tickets in advance recommended", "service guarantee", "snap/ebt", "organic products", "onsite services", "prepared foods", "restaurant", "quick visit"
  ]
}

// Helper function to get appropriate icon for each category
function getCategoryIcon(category: string) {
  const iconMap: { [key: string]: React.ReactNode } = {
    'Service options': <Coffee className="h-5 w-5 text-primary" />,
    'Highlights': <Star className="h-5 w-5 text-primary" />,
    'Offerings': <Coffee className="h-5 w-5 text-primary" />,
    'Dining options': <Hamburger className="h-5 w-5 text-primary" />,
    'Amenities': <Wifi className="h-5 w-5 text-primary" />,
    'Atmosphere': <Heart className="h-5 w-5 text-primary" />,
    'Crowd': <Users className="h-5 w-5 text-primary" />,
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
      {/* Summary List */}
      <ul className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-primary-50 rounded-xl p-4">
        {[...POPULAR_AMENITIES].sort((a, b) => a.label.localeCompare(b.label)).map(({ label, key, icon }) => {
          const available = hasAmenity(key)
          return (
            <li
              key={key}
              className="flex items-center px-2 py-2 rounded"
            >
              <span className={available ? "text-tarawera font-semibold" : "text-manatee opacity-70"}>{icon}</span>
              <span className={available ? "ml-2 font-semibold text-tarawera" : "ml-2 text-manatee opacity-70"}>{label}</span>
              {available && <Check className="ml-2 h-4 w-4 text-tarawera" />}
            </li>
          )
        })}
      </ul>
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