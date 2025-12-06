import Link from 'next/link'
import { MapPin as MapPinIcon, Star } from 'lucide-react'
import React from 'react'

interface TopStatesCardProps {
  name: string
  count: number
  rank: number
  href: string
}

export default function TopStatesCard({ name, count, rank, href }: TopStatesCardProps) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 hover:border-tarawera-300 transform hover:-translate-y-1"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="bg-primary-light-100 p-3 rounded-full mr-4">
            <MapPinIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-tarawera">
              {name}
            </h3>
            <div className="flex items-center text-sm text-manatee">
              <Star className="h-4 w-4 text-yellow-400 mr-1 fill-current" />
              <span>#{rank} Most Schools</span>
            </div>
          </div>
        </div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-tarawera mb-2">
          {count}
        </div>
        <div className="text-sm text-manatee mb-4">
          {count === 1 ? 'Taekwondo School' : 'Taekwondo Schools'}
        </div>
        <div className="bg-tarawera text-white px-4 py-2 rounded-lg font-medium hover:bg-tarawera-200 transition-colors">
          Explore Schools →
        </div>
      </div>
    </Link>
  )
} 