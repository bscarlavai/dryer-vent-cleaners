"use client";
import { useState, useEffect, Suspense, useRef } from "react";
import { getLocationImageUrl, type LocationImage } from "@/lib/imageUtils";

interface Location {
  id: string;
  name: string;
  street_address?: string;
  photo_url?: string;
  location_images?: LocationImage[];
  description?: string;
  review_tags?: string[];
  location_hours?: any;
  reviews_tags?: string[];
  street_view_url?: string;
  business_status?: string;
  google_rating?: number;
  location_url?: string;
  business_type?: string;
  business_types?: string[];
  review_status?: 'pending' | 'approved' | 'rejected';
}

const PAGE_SIZE = 10;
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function LocationsReviewPageInner() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [searchText, setSearchText] = useState('');
  const [only24Hour, setOnly24Hour] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const isResettingPage = useRef(false);

  // Data fetching
  useEffect(() => {
    setDataLoading(true);
    setErrorMsg(null);
    const fetchPending = async () => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: PAGE_SIZE.toString(),
          status: reviewStatus,
          search: searchText,
          only24: only24Hour ? 'true' : 'false',
        });
        const res = await fetch(`/api/admin/locations?${params.toString()}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Unknown error');
        }
        const { data, count } = await res.json();
        setLocations(data || []);
        setTotalCount(count ?? 0);
        // Calculate hasMore based on current page and total count
        setHasMore((count ?? 0) > (page + 1) * PAGE_SIZE);
        
        // If we're on a page that's beyond the available data, reset to page 0
        if (data && data.length === 0 && page > 0 && !isResettingPage.current) {
          isResettingPage.current = true;
          setPage(0);
          // Reset the flag after a short delay
          setTimeout(() => {
            isResettingPage.current = false;
          }, 100);
        }
      } catch (error: any) {
        setErrorMsg(error.message || 'Unknown error');
      }
      setDataLoading(false);
    };
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, reviewStatus, searchText, only24Hour]);

  async function handleReview(id: string, status: 'approved' | 'rejected') {
    try {
      const res = await fetch('/api/admin/locations-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Unknown error');
      }
      
      // Remove the item from current page and handle pagination
      setLocations(locs => {
        const updated = locs.filter(loc => loc.id !== id);
        
        // If this was the last item on the page, we need to handle pagination
        if (updated.length === 0) {
          // Check if there are more items in the database
          const newTotalCount = totalCount - 1;
          const currentPageStart = page * PAGE_SIZE;
          const currentPageEnd = currentPageStart + PAGE_SIZE;
          
          // If we still have items after this page, go to next page
          if (newTotalCount > currentPageEnd) {
            setTimeout(() => {
              setPage(p => p + 1);
            }, 0);
          } else if (page > 0 && newTotalCount <= currentPageStart) {
            // If we're not on the first page and there are no items on this page, go to previous page
            setTimeout(() => {
              setPage(p => Math.max(0, p - 1));
            }, 0);
          }
        }
        
        return updated;
      });
      
      // Update total count
      setTotalCount(prev => Math.max(0, prev - 1));
      
    } catch (error: any) {
      setErrorMsg(error.message || 'Unknown error');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 w-full">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-900">Pending Location Reviews</h1>
      <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">
        <div className="flex items-center">
          <label htmlFor="reviewStatus" className="mr-2 font-semibold text-gray-900">Filter by status:</label>
          <select
            id="reviewStatus"
            value={reviewStatus}
            onChange={e => { setPage(0); setReviewStatus(e.target.value as any); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
          >
            <option value="pending">Pending</option>
            <option value="approved">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="flex items-center ml-4">
          <input
            type="checkbox"
            id="only24Hour"
            checked={only24Hour}
            onChange={e => { setPage(0); setOnly24Hour(e.target.checked); }}
            className="mr-2"
          />
          <label htmlFor="only24Hour" className="font-semibold text-gray-900">Show only 24-hour locations</label>
        </div>
      </div>
      <div className="flex justify-center mb-8">
        <input
          type="text"
          placeholder="Search by name or description..."
          value={searchText}
          onChange={e => { setPage(0); setSearchText(e.target.value); }}
          className="w-full max-w-xl px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 placeholder-gray-400"
        />
      </div>
      {errorMsg && (
        <div className="p-8 text-center text-red-600 font-semibold">Error: {errorMsg}</div>
      )}
      {dataLoading ? (
        <div className="p-8 text-center">Loading…</div>
      ) : locations.length === 0 && !errorMsg ? (
        <div className="p-8 text-center">No pending locations.</div>
      ) : (
        <>
          <div className="space-y-8">
            {locations.map(loc => {
              // Normalize URL by removing query parameters (for deduplication)
              const normalizeUrl = (url?: string) => {
                if (!url) return '';
                const equalsIndex = url.indexOf('=');
                return equalsIndex !== -1 ? url.substring(0, equalsIndex) : url;
              };

              // Build a list of all images to display
              const imagesToDisplay: Array<{ url: string; label: string; source: string }> = [];
              const displayedUrls = new Set<string>(); // Track normalized URLs to avoid duplicates

              // Add Cloudflare images first (primary images only)
              if (loc.location_images && loc.location_images.length > 0) {
                loc.location_images
                  .filter(img => img.is_primary)
                  .forEach(img => {
                    const url = getLocationImageUrl([img], img.image_type, 'detail');
                    if (url) {
                      const normalizedUrl = normalizeUrl(url);
                      if (!displayedUrls.has(normalizedUrl)) {
                        imagesToDisplay.push({
                          url,
                          label: img.image_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                          source: 'Cloudflare'
                        });
                        displayedUrls.add(normalizedUrl);

                        // Also track the source URL so we don't show Google fallback for the same image
                        if (img.image_type === 'photo' && loc.photo_url) {
                          displayedUrls.add(normalizeUrl(loc.photo_url));
                        }
                        if (img.image_type === 'street_view' && loc.street_view_url) {
                          displayedUrls.add(normalizeUrl(loc.street_view_url));
                        }
                      }
                    }
                  });
              }

              // Add Google images as fallback only if we haven't already shown this image
              const cfImageTypes = new Set(loc.location_images?.filter(img => img.is_primary).map(img => img.image_type) || []);

              // Only show Google photo if:
              // 1. No Cloudflare photo exists AND
              // 2. This URL hasn't been displayed yet (normalized)
              if (loc.photo_url && !cfImageTypes.has('photo')) {
                const normalizedUrl = normalizeUrl(loc.photo_url);
                if (!displayedUrls.has(normalizedUrl)) {
                  imagesToDisplay.push({
                    url: loc.photo_url,
                    label: 'Photo',
                    source: 'Google'
                  });
                  displayedUrls.add(normalizedUrl);
                }
              }

              // Only show Google street view if:
              // 1. No Cloudflare street_view exists AND
              // 2. This URL hasn't been displayed yet (normalized)
              if (loc.street_view_url && !cfImageTypes.has('street_view')) {
                const normalizedUrl = normalizeUrl(loc.street_view_url);
                if (!displayedUrls.has(normalizedUrl)) {
                  imagesToDisplay.push({
                    url: loc.street_view_url,
                    label: 'Street View',
                    source: 'Google'
                  });
                  displayedUrls.add(normalizedUrl);
                }
              }

              return (
                <div key={loc.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 flex flex-col gap-6 items-start max-w-4xl mx-auto">
                  {/* Display all images */}
                  {imagesToDisplay.length > 0 && (
                    <div className="w-full space-y-4">
                      {imagesToDisplay.map((img, idx) => (
                        <div key={idx} className="w-full">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-700">{img.label}</span>
                            <span className={`text-xs px-2 py-1 rounded ${img.source === 'Cloudflare' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                              {img.source}
                            </span>
                          </div>
                          <img
                            src={img.url}
                            alt={`${loc.name} - ${img.label}`}
                            className="w-full max-w-3xl h-[28rem] object-cover rounded-lg border border-gray-100 mx-auto"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-tarawera mb-2">{loc.name}</h2>
                    {loc.street_address && <div className="text-gray-700 mb-1">{loc.street_address}</div>}
                    {loc.business_types && loc.business_types.length > 0 && (
                      <div className="text-xs text-gray-500 mb-1">
                        Types: {[...loc.business_types].sort().join(', ')}
                      </div>
                    )}
                    {loc.business_status && (
                      <div className="text-xs text-gray-500 mb-1">Status: {loc.business_status}</div>
                    )}
                    {loc.review_status && (
                      <div className="text-xs text-gray-500 mb-1">Review Status: <span className="font-semibold">{loc.review_status.charAt(0).toUpperCase() + loc.review_status.slice(1)}</span></div>
                    )}
                    {typeof loc.google_rating === 'number' && (
                      <div className="text-xs text-gray-500 mb-1">Google Rating: {loc.google_rating}</div>
                    )}
                    {loc.location_url && (
                      <div className="text-xs text-gray-500 mb-1">
                        <a href={loc.location_url} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 text-base font-semibold bg-primary text-white rounded-lg shadow hover:bg-tarawera transition">View Location</a>
                      </div>
                    )}
                    {loc.description && <div className="text-gray-600 mb-2 text-sm">{loc.description}</div>}
                    {loc.location_hours && Array.isArray(loc.location_hours) && loc.location_hours.length > 0 && (
                      <div className="text-xs text-gray-500 mb-2">
                        <strong>Hours:</strong>
                        <ul className="ml-2 mt-1">
                          {dayNames.map((day, i) => {
                            const entry = loc.location_hours.find((h: any) => h.day_of_week === i + 1);
                            if (!entry) return (
                              <li key={day}>{day}: <span className="italic">No data</span></li>
                            );
                            return (
                              <li key={day}>
                                {day}: {entry.is_closed ? <span className="italic">Closed</span> : `${entry.open_time} - ${entry.close_time}`}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    {loc.reviews_tags && Array.isArray(loc.reviews_tags) && loc.reviews_tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {loc.reviews_tags.map((tag: string) => (
                          <span key={tag} className="bg-primary-100 text-primary px-2 py-1 rounded text-xs">{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-4 mt-4">
                      <button
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                        onClick={() => handleReview(loc.id, 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                        onClick={() => handleReview(loc.id, 'rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Pagination Controls */}
          <div className="flex justify-center gap-4 mt-10">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold disabled:opacity-50"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0 || dataLoading}
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700 font-semibold">
              Page {page + 1} of {Math.max(1, Math.ceil(totalCount / PAGE_SIZE))} ({totalCount} total)
            </span>
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold disabled:opacity-50"
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore || dataLoading}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function LocationsReviewPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <LocationsReviewPageInner />
    </Suspense>
  );
} 