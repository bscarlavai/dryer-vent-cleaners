'use client'

import { useEffect } from 'react'

interface AdPlacementProps {
  placeholderId: number
  className?: string
}

/**
 * Ezoic Ad Placement Component
 *
 * Renders an ad placeholder and triggers Ezoic to load the ad.
 * Must be used as a client component since it interacts with window.ezstandalone.
 *
 * @param placeholderId - The Ezoic placeholder ID from the dashboard
 * @param className - Optional additional CSS classes for the container
 */
export default function AdPlacement({ placeholderId, className = '' }: AdPlacementProps) {
  useEffect(() => {
    // Ensure we're in browser environment and Ezoic is loaded
    if (typeof window !== 'undefined' && window.ezstandalone) {
      window.ezstandalone.cmd = window.ezstandalone.cmd || []
      window.ezstandalone.cmd.push(() => {
        window.ezstandalone.showAds(placeholderId)
      })
    }
  }, [placeholderId])

  return (
    <section className={`my-8 max-w-7xl mx-auto px-4 ${className}`}>
      <div id={`ezoic-pub-ad-placeholder-${placeholderId}`} />
    </section>
  )
}
