'use client'

import { useState, useEffect } from 'react'
import { Search as SearchIcon, MapPin, Star } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import slugify from '@/lib/slugify';

interface SearchResult {
  id: string
  name: string
  city: string
  state: string
  slug: string
  city_slug?: string
  google_rating?: number
  description?: string
}

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const searchLocations = async () => {
      if (query.length < 2) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        setResults(data.results || [])
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(searchLocations, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault()
      setShowResults(false)
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="relative z-10">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-20">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by name, city, state, or zip code..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowResults(true)
          }}
          onFocus={() => setShowResults(true)}
          onKeyDown={handleKeyDown}
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary relative z-10"
        />
      </div>

      {/* Search Results Dropdown */}
      {showResults && (query.length > 0 || isLoading) && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-gray-500">Searching...</div>
          ) : results.length > 0 ? (
            <div>
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={`/states/${slugify(result.state)}/${result.city_slug || slugify(result.city)}/${result.slug}`}
                  onClick={() => {
                    setShowResults(false)
                    setQuery('')
                  }}
                  className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{result.name}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {result.city}, {result.state}
                      </div>
                      {result.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {result.description}
                        </p>
                      )}
                    </div>
                    {result.google_rating && (
                      <div className="flex items-center ml-4">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium text-gray-900 ml-1">
                          {result.google_rating}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="px-4 py-3">
              <div className="text-gray-500 mb-2">
                No taekwondo schools found for "{query}"
              </div>
              <div className="text-sm text-gray-400 space-y-1">
                <div>• Try searching by city name (e.g., "Miami")</div>
                <div>• Try searching by state name (e.g., "Florida")</div>
                <div>• Try searching by zip code (e.g., "32801")</div>
                <div>• Try searching by school name (e.g., "Dragon")</div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Click outside to close */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  )
}

// Hero Search Component
export function HeroSearch() {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    // If both fields are empty, don't search
    if (!query.trim() && !location.trim()) {
      return
    }

    // Build search URL
    const searchParams = new URLSearchParams()
    if (query.trim()) searchParams.set('q', query.trim())
    if (location.trim()) searchParams.set('location', location.trim())
    
    // Navigate to search page
    router.push(`/search?${searchParams.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search taekwondo schools..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
          />
        </div>
        <div className="flex-1">
          <input
            type="text"
            placeholder="City or State"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
          />
        </div>
        <button
          type="submit"
          className="px-8 py-3 bg-primary text-white rounded-lg font-semibold shadow-soft hover:shadow-soft-hover hover:bg-primary-700 transition-all duration-300"
        >
          Search
        </button>
      </div>
    </form>
  )
} 