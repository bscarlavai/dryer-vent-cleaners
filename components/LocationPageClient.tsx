'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Phone, Star, Navigation, Heart, Calendar, Coffee, Wifi, Car, Users, CreditCard, Baby, X, ThumbsUp, BrushCleaning } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { LocalBusinessStructuredData, BreadcrumbStructuredData } from '@/components/StructuredData'
import { formatHours } from '@/lib/timeUtils'
import { getLocationImageUrl, generatePlaceholderGradient, type LocationImage } from '@/lib/imageUtils'
import React from 'react'
import dynamic from 'next/dynamic'
import AmenitiesSummaryAndDetails from '@/components/AmenitiesSummaryAndDetails'
import { useAnalytics } from '@/lib/analytics'
import HeroSection from '@/components/HeroSection'
import slugify from '@/lib/slugify'
import ReportProblemModal from '@/components/ReportProblemModal'
import LocationHours from '@/components/LocationHours'
// DISABLED - Re-enable after domain configuration
// import AdPlacement from '@/components/AdPlacement'

const NearbyLocationsSection = dynamic(() => import('@/components/NearbyLocationsSection'), { ssr: false })

// Helper function to get appropriate icon for each category
function getCategoryIcon(category: string) {
  const iconMap: { [key: string]: JSX.Element } = {
    'Service options': <Coffee className="h-5 w-5 text-primary" />,
    'Highlights': <Star className="h-5 w-5 text-primary" />,
    'Offerings': <Coffee className="h-5 w-5 text-primary" />,
    'Dining options': <Coffee className="h-5 w-5 text-primary" />,
    'Amenities': <Wifi className="h-5 w-5 text-primary" />,
    'Atmosphere': <Heart className="h-5 w-5 text-primary" />,
    'Crowd': <Users className="h-5 w-5 text-primary" />,
    'Planning': <Calendar className="h-5 w-5 text-primary" />,
    'Payments': <CreditCard className="h-5 w-5 text-primary" />,
    'Children': <Baby className="h-5 w-5 text-primary" />,
    'Parking': <Car className="h-5 w-5 text-primary" />,
    'Other': <Star className="h-5 w-5 text-primary" />,
  };

  return iconMap[category] || <Star className="h-5 w-5 text-primary" />;
}

export default function LocationPageClient({ location: initialLocation, params }: { location: any, params: any }) {
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [claimForm, setClaimForm] = useState({ name: '', email: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [claimMessage, setClaimMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [location, setLocation] = useState(initialLocation)
  const { trackLocationButtonClick } = useAnalytics()
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState<{ recommended: boolean | null; comment: string; email: string; honeypot: string }>({ recommended: null, comment: '', email: '', honeypot: '' });
  const [reviewStats, setReviewStats] = useState({ total: 0, recommended_count: 0, percent_recommended: 0, recent_comments: [] });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [loadingStats, setLoadingStats] = useState(true);


  // Fetch review stats
  useEffect(() => {
    async function fetchStats() {
      setLoadingStats(true);
      try {
        const res = await fetch(`/api/locations/${location.id}/reviews`);
        const data = await res.json();
        setReviewStats(data);
      } catch {
        setReviewStats({ total: 0, recommended_count: 0, percent_recommended: 0, recent_comments: [] });
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
  }, [location.id]);

  // Handle review submit
  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmittingReview(true);
    setReviewMessage('');
    try {
      const res = await fetch(`/api/locations/${location.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm),
      });
      const data = await res.json();
      if (res.ok) {
        setReviewMessage('Thank you for your review! It will appear here once approved.');
        setReviewForm({ recommended: null, comment: '', email: '', honeypot: '' });
        // Refresh stats
        const statsRes = await fetch(`/api/locations/${location.id}/reviews`);
        setReviewStats(await statsRes.json());
        setTimeout(() => setShowReviewModal(false), 1500);
      } else {
        setReviewMessage(data.error || 'Error submitting review.');
      }
    } catch {
      setReviewMessage('Error submitting review.');
    } finally {
      setIsSubmittingReview(false);
    }
  }

  const htmlSnippet = `<a href="https://www.dryerventcleaners.co/states/${params.state}/${params.city}/${params.slug}" target="_blank" rel="noopener noreferrer">
  <img src="https://www.dryerventcleaners.co/dryerventcleaners.png" alt="Verified by Dryer Vent Cleaners" style="height: 64px; width: auto;">
</a>`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(htmlSnippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setClaimMessage('')

    // Track the submit claim event
    trackLocationButtonClick('submit_claim', location.name, `${location.city}, ${location.state}`, {
      claimer_name: claimForm.name,
      claimer_email: claimForm.email
    })

    try {
      const supabase = getSupabaseClient()
      
      // Insert the claim record
      const { error: claimError } = await supabase
        .from('location_claims')
        .insert({
          location_id: location.id,
          name: claimForm.name,
          email: claimForm.email
        })

      if (claimError) {
        if (claimError.code === '23505') { // Unique constraint violation
          setClaimMessage('A claim has already been submitted for this location.')
        } else {
          setClaimMessage('Error submitting claim. Please try again.')
        }
        return
      }

      // Update the location's claimed_status to "pending"
      const { error: updateError } = await supabase
        .from('locations')
        .update({ claimed_status: 'pending' })
        .eq('id', location.id)

      if (updateError) {
        console.error('Error updating location status:', updateError)
        setClaimMessage('Claim submitted, but there was an issue updating the status. Please contact support.')
      } else {
        // Update local state to reflect the new claimed_status
        setLocation((prevLocation: any) => ({
          ...prevLocation,
          claimed_status: 'pending'
        }))
        setClaimMessage('Claim submitted successfully! We will review your submission and contact you soon.')
        setShowClaimModal(false)
        setClaimForm({ name: '', email: '' })
      }
    } catch (error) {
      setClaimMessage('Error submitting claim. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }



  // Check for any available image type (street_view, photo, logo)
  const heroImage =
    getLocationImageUrl(location.location_images as LocationImage[], 'street_view', 'detail') ||
    getLocationImageUrl(location.location_images as LocationImage[], 'photo', 'detail') ||
    getLocationImageUrl(location.location_images as LocationImage[], 'logo', 'detail')

  const placeholderGradient = !heroImage ? generatePlaceholderGradient(location.id) : null

  // Group amenities by category
  const amenitiesByCategory = location.location_amenities?.reduce((acc: { [key: string]: string[] }, amenity: any) => {
    if (!acc[amenity.amenity_category]) {
      acc[amenity.amenity_category] = []
    }
    acc[amenity.amenity_category].push(amenity.amenity_name)
    return acc
  }, {}) || {}

  // Sort amenities within each category alphabetically
  Object.keys(amenitiesByCategory).forEach(category => {
    amenitiesByCategory[category].sort()
  })

  // Get sorted categories for display
  const sortedCategories = Object.keys(amenitiesByCategory).sort()

  // Format hours for display
  const formattedHours = formatHours(location.location_hours || [])

  // Breadcrumb items for structured data
  const breadcrumbItems = [
    { name: 'Home', url: 'https://www.dryerventcleaners.co' },
    { name: 'States', url: 'https://www.dryerventcleaners.co/states' },
    { name: location.state, url: `https://www.dryerventcleaners.co/states/${params.state}` },
    { name: location.city, url: `https://www.dryerventcleaners.co/states/${params.state}/${params.city}` },
    { name: location.name, url: `https://www.dryerventcleaners.co/states/${params.state}/${params.city}/${params.slug}` }
  ]

  const citySlug = location.city_slug
  const stateSlug = slugify(location.state)

  const breadcrumbs = (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
        <li className="break-words">
          <Link href="/" className="hover:text-primary">Home</Link>
        </li>
        <li>/</li>
        <li className="break-words">
          <Link href="/states" className="hover:text-primary">States</Link>
        </li>
        <li>/</li>
        <li className="break-words">
          <Link href={`/states/${params.state}`} className="hover:text-primary">{location.state}</Link>
        </li>
        <li>/</li>
        <li className="break-words">
          <Link href={`/cities/${citySlug}-${stateSlug}`} className="hover:text-primary">{location.city}</Link>
        </li>
        <li>/</li>
        <li className="text-gray-900 font-medium break-words">{location.name}</li>
      </ol>
    </nav>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {!loadingStats && (
        <LocalBusinessStructuredData location={{
          ...location,
          user_rating: reviewStats.percent_recommended,
          user_review_count: reviewStats.total
        }} />
      )}
      <BreadcrumbStructuredData items={breadcrumbItems} />

      <HeroSection
        title={<span className="break-words">{location.name}</span>}
        description={<span>Dryer Vent Cleaning Service in {location.city}, {location.state}</span>}
        breadcrumbs={
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">{breadcrumbs}</div>
        }
      />

      {/* Overlap Card for image, rating, address, actions */}
      <section className="relative z-10 -mt-12 mb-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden relative">
            {/* Hero Image or Gradient Placeholder */}
            <div className="relative h-64 md:h-80 overflow-hidden rounded-t-2xl">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={`${location.name} dryer vent cleaning service in ${location.city}, ${location.state}`}
                  className="w-full h-full object-cover"
                  loading="eager"
                  width={800}
                  height={400}
                />
              ) : placeholderGradient ? (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: placeholderGradient }}
                >
                  <BrushCleaning className="w-40 h-40 text-white opacity-30" strokeWidth={1.5} />
                </div>
              ) : null}
            </div>
            {/* Name, Rating, Address, Actions */}
            <div className="px-8 pt-6 pb-2">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
                <div className="min-w-0 flex-1 flex flex-col h-full relative">
                  <div className="flex items-center space-x-4 mb-2">
                    {location.google_rating && (
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 flex items-center shadow">
                        <Star className="h-5 w-5 text-yellow-500 mr-1 fill-current" />
                        <span className="text-lg font-bold text-gray-900">{location.google_rating}</span>
                        {location.review_count && (
                          <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Google Reviews</span>
                        )}
                      </div>
                    )}
                  </div>
                  {location.street_address && (
                    <div className="flex items-start mb-2">
                      <MapPin className="h-5 w-5 mr-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-900">{location.street_address.split(',')[0]}</p>
                        <p className="text-gray-600">{location.city}, {location.state} {location.postal_code}</p>
                      </div>
                    </div>
                  )}
                  
                  <LocationHours location={location} />
                  
                  {location.description && (
                    <p className="text-gray-700 mt-6 mb-3 leading-relaxed">{location.description}</p>
                  )}
                </div>
                {/* Action Buttons */}
                <div className="flex flex-col w-full lg:w-64 flex-shrink-0 space-y-3 mt-4 lg:mt-0 mb-6">
                  {location.latitude && location.longitude && (
                    <a
                      href={location.location_url || `https://maps.google.com/?q=${encodeURIComponent(location.name + ' ' + (location.street_address || '') + ' ' + location.city + ' ' + location.state)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackLocationButtonClick('get_directions', location.name, `${location.city}, ${location.state}`)}
                      className="group flex items-center w-full px-4 py-3 rounded-lg bg-primary shadow-sm hover:shadow-md hover:bg-primary/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      <Navigation className="h-5 w-5 mr-2.5 text-white transition-transform group-hover:scale-105" />
                      <span className="font-medium text-white">Get Directions</span>
                    </a>
                  )}
                  {location.phone && (
                    <a
                      href={`tel:${location.phone}`}
                      onClick={() => trackLocationButtonClick('call_now', location.name, `${location.city}, ${location.state}`)}
                      className="group flex items-center w-full px-4 py-3 rounded-lg bg-primary shadow-sm hover:shadow-md hover:bg-primary/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      <Phone className="h-5 w-5 mr-2.5 text-white transition-transform group-hover:scale-105" />
                      <span className="font-medium text-white">Call Now</span>
                    </a>
                  )}
                  <button
                    type="button"
                    className="group flex items-center w-full px-4 py-3 rounded-lg bg-primary-light-100 text-primary font-semibold shadow-sm hover:bg-primary-light-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    onClick={() => setShowReviewModal(true)}
                  >
                    <svg className="h-5 w-5 mr-2.5 text-primary transition-transform group-hover:scale-105" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 20l.8-4A8.96 8.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    <span className="font-medium">Leave Review</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Reviews Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <section className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
            <div className="w-8 h-8 bg-primary-light-100 rounded-lg flex items-center justify-center mr-3">
              <ThumbsUp className="h-5 w-5 text-primary" />
            </div>
            User Reviews
          </h2>
          <div className="bg-primary-light-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <span className={`text-3xl font-bold ${reviewStats.total === 0 ? 'text-primary' : reviewStats.percent_recommended >= 50 ? 'text-green-700' : 'text-red-700'}`}>
                {reviewStats.percent_recommended}%
              </span>
              <span className="text-lg text-gray-700">recommend</span>
              <span className="ml-4 text-base text-gray-500">{reviewStats.total} reviews</span>
            </div>
            <div className="text-base font-semibold text-gray-900 mb-2">Recent Comments</div>
            {reviewStats.recent_comments && reviewStats.recent_comments.length > 0 ? (
              <ul className="space-y-2">
                {reviewStats.recent_comments.map((c: any, i: number) => (
                  <li key={i} className="flex items-start gap-3 bg-white border border-primary-light-200 rounded px-3 py-2 text-gray-800 text-sm">
                    {c.recommended ? (
                      <ThumbsUp className="h-5 w-5 flex-shrink-0 mt-0.5 text-green-600" />
                    ) : (
                      <ThumbsUp className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-600 rotate-180" />
                    )}
                    <span className="flex-1">{c.comment}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-400 text-sm italic mt-2">No reviews yet. Be the first to leave one!</div>
            )}
          </div>
        </section>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Amenities Section */}
        {Object.keys(amenitiesByCategory).length > 0 && (
          <AmenitiesSummaryAndDetails 
            amenitiesByCategory={amenitiesByCategory} 
            sortedCategories={sortedCategories} 
          />
        )}

        {/* Reviews Tags Section */}
        {location.reviews_tags && location.reviews_tags.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Review Highlights</h2>
            <div className="flex flex-wrap gap-2">
              {location.reviews_tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ad Placement - After main content, before nearby locations */}
      {/* Ad Placement - DISABLED - Re-enable after domain configuration */}
      {/* <AdPlacement placeholderId={111} /> */}

      {/* Report a Problem Link */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <p className="text-sm text-gray-500 text-center">
          <span
            className="text-primary underline cursor-pointer hover:text-primary/80 transition-colors"
            onClick={() => setShowFeedbackModal(true)}
          >
            Report a problem with this listing
          </span>
        </p>
      </div>

      {/* Nearby Dryer Vent Cleaning Services Section - full width */}
      {location.latitude && location.longitude && (
        <NearbyLocationsSection 
          latitude={location.latitude} 
          longitude={location.longitude} 
          currentLocationId={location.id} 
          city={location.city} 
          state={location.state} 
        />
      )}

      {/* Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-auto">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-white px-6 py-4 flex items-center justify-between border-b border-gray-200 rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-900">Claim Your Listing</h2>
              <button
                onClick={() => setShowClaimModal(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {/* Modal Content */}
            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                <div>                  
                  <div className="mt-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <div className="mb-4">
                      {/* Preview */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                        <p className="text-sm text-gray-600 mb-2">Preview:</p>
                        <div className="flex items-center justify-center">
                          <div 
                            className="bg-white p-3 rounded-lg shadow-sm border border-gray-200"
                            dangerouslySetInnerHTML={{
                              __html: htmlSnippet
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Code Block */}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-700">HTML Code:</p>
                        <button
                          onClick={copyToClipboard}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-primary text-sm leading-relaxed">
                          <code>{htmlSnippet}</code>
                        </pre>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-primary text-white rounded-lg">
                      <p className="text-sm">
                        Copy this code and paste it into your website's HTML. Then submit your name and email and we'll confirm your ownership.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleClaimSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={claimForm.name}
                      onChange={(e) => setClaimForm({ ...claimForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={claimForm.email}
                      onChange={(e) => setClaimForm({ ...claimForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter your email address"
                    />
                  </div>

                  {claimMessage && (
                    <div className={`p-3 rounded-lg text-sm ${
                      claimMessage.includes('successfully') 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {claimMessage}
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-primary text-white px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClaimModal(false)}
                      className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <ReportProblemModal 
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        locationId={location.id}
        isGlobal={false}
      />
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-auto">
            <div className="sticky top-0 z-10 bg-white px-6 py-4 flex items-center justify-between border-b border-gray-200 rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-900">Leave Review</h2>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleReviewSubmit} className="px-6 py-6 max-h-[70vh] overflow-y-auto space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Would you recommend this location? *</label>
                <div className="flex gap-4 mt-2">
                  <button type="button" className={`px-4 py-2 rounded-lg border ${reviewForm.recommended === true ? 'bg-green-100 border-green-400 text-green-700' : 'bg-white border-gray-300 text-gray-700'}`} onClick={() => setReviewForm(f => ({ ...f, recommended: true }))}>
                    👍 Yes
                  </button>
                  <button type="button" className={`px-4 py-2 rounded-lg border ${reviewForm.recommended === false ? 'bg-red-100 border-red-400 text-red-700' : 'bg-white border-gray-300 text-gray-700'}`} onClick={() => setReviewForm(f => ({ ...f, recommended: false }))}>
                    👎 No
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
                <textarea
                  id="review-comment"
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[80px]"
                  placeholder="Share your experience..."
                />
              </div>
              <div>
                <label htmlFor="review-email" className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                <input
                  type="email"
                  id="review-email"
                  value={reviewForm.email}
                  onChange={e => setReviewForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="If you'd like a verification badge, enter your email"
                />
              </div>
              {/* Honeypot field (hidden from users) */}
              <div style={{ display: 'none' }}>
                <label htmlFor="review-honeypot">Leave this field empty</label>
                <input
                  type="text"
                  id="review-honeypot"
                  value={reviewForm.honeypot}
                  onChange={e => setReviewForm(f => ({ ...f, honeypot: e.target.value }))}
                  autoComplete="off"
                  tabIndex={-1}
                />
              </div>
              {reviewMessage && (
                <div className="p-3 rounded-lg text-sm text-center "
                  style={{ color: reviewMessage.includes('Thank you') ? '#15803d' : '#dc2626', background: reviewMessage.includes('Thank you') ? '#f0fdf4' : '#fef2f2' }}>
                  {reviewMessage}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview || reviewForm.recommended === null}
                  className="bg-primary text-white px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 