# Ad Strategy for Self Service Car Wash Finder

This document outlines the advertising strategy for integrating Ezoic ads into the Self Service Car Wash Finder website.

## Overview

We've implemented a **conservative, non-intrusive** ad strategy that focuses on:
- ✅ Strategic placement at natural content breaks
- ✅ Targeting high-traffic pages
- ✅ Maintaining excellent user experience
- ✅ Starting small with room for expansion

## Integration Method

**Provider:** Ezoic Ads
**Integration Type:** JavaScript Standalone (Client-side)
**Implementation:** Custom React component (`AdPlacement`) for Next.js compatibility

### Technical Setup

1. **Script Loading** (in `app/layout.tsx`):
   - Privacy scripts loaded with `beforeInteractive` strategy
   - Main Ezoic script: `https://www.ezojs.com/ezoic/sa.min.js`
   - Window initialization: `window.ezstandalone`

2. **ads.txt Setup** (in `next.config.js`):
   - 301 redirect from `/ads.txt` to Ezoic's hosted ads.txt manager
   - Automatic updates managed by Ezoic

3. **Component Architecture**:
   - Reusable `AdPlacement` component at `components/AdPlacement.tsx`
   - Client-side only rendering (marked with `'use client'`)
   - TypeScript declarations at `types/ezoic.d.ts`

## Current Ad Placements (Phase 1)

We've implemented **4 strategic ad placements** based on traffic data and user experience considerations.

### 1. Search Results Page - ID 112 (`long_content`)

**File:** `app/search/page.tsx`
**Location:** After search results grid, before "How to Search" section
**Traffic:** 422 views/month (4.69% of total) - **Highest traffic page**
**Avg Time:** 1m 55s - **Longest engagement time**

**Rationale:**
- Users have already consumed primary content (results)
- Natural break before educational content
- High engagement indicates users are actively browsing

### 2. Homepage - ID 111 (`mid_content`)

**File:** `app/page.tsx`
**Location:** Between "Features" section and "FAQ" section
**Traffic:** 351 views/month (3.9% of total)
**Avg Time:** 31s

**Rationale:**
- High entry point for new visitors (5.24% of users start here)
- Natural content break after value propositions
- Users have seen enough content to understand the site

### 3. Near Me Page - ID 112 (`long_content`)

**File:** `components/NearMeClient.tsx`
**Location:** After search results, before "SEO/Feature" section
**Traffic:** 266 views/month (2.96% of total)
**Avg Time:** 25s

**Rationale:**
- High-intent search page (users looking for specific locations)
- Natural break after results consumption
- Strong engagement despite shorter time

### 4. Location Detail Pages - ID 111 (`mid_content`)

**File:** `components/LocationPageClient.tsx`
**Location:** After amenities/reviews, before "Report a Problem" link
**Traffic:** **~6,000+ views/month** (estimated 67% of total - long tail)
**Avg Time:** Varies by page

**Rationale:**
- **CRITICAL PLACEMENT** - Represents bulk of site traffic across all location pages
- Users have consumed key information (hours, amenities, reviews)
- Natural break before nearby locations section
- Most valuable placement due to volume

## Traffic Coverage Analysis

### Total Estimated Monthly Ad Impressions: ~7,000+

**Breakdown:**
- Search Results: 422 impressions
- Homepage: 351 impressions
- Near Me: 266 impressions
- Location Pages: ~6,000+ impressions (combined long tail)

**Coverage:** ~78% of total site traffic with only 4 placements

## Placement Strategy Principles

### ✅ What We Did

1. **Natural Content Breaks** - All ads placed between logical sections
2. **Post-Consumption Placement** - Ads appear after users see primary content
3. **High-Value Pages** - Focused on pages with best traffic/engagement
4. **Mobile-Friendly** - Responsive design with consistent spacing
5. **Long-Tail Focus** - Prioritized location pages (collective 67% traffic)

### ❌ What We Avoided

1. **Above-the-Fold Ads** - No ads in hero sections or immediately visible areas
2. **Floating/Sticky Ads** - No persistent ads that follow scrolling
3. **Interrupting CTAs** - Ads placed away from conversion elements
4. **Low-Traffic Pages** - Skipped individual state/city pages for now
5. **Excessive Density** - Limited to 1 ad per page

## Ezoic Placeholder IDs Used

From Ezoic Dashboard:

| ID  | Name             | Position Type    | Used On                    |
|-----|------------------|------------------|----------------------------|
| 111 | `mid_content`    | Mid-content      | Homepage, Location Pages   |
| 112 | `long_content`   | Long content     | Search Results, Near Me    |

### Available for Future Use

| ID  | Name                    | Position Type       | Potential Use           |
|-----|-------------------------|---------------------|-------------------------|
| 113 | `longer_content`        | Longer content      | State pages             |
| 114 | `longest_content`       | Longest content     | City pages              |
| 115 | `incontent_5`           | In-content #5       | Blog/article content    |
| 106 | `sidebar_bottom`        | Sidebar bottom      | Desktop sidebar         |
| 107 | `sidebar_floating_1`    | Floating sidebar    | Sticky sidebar          |
| 108 | `sidebar_floating_2`    | Floating sidebar    | Additional sidebar      |
| 109 | `under_first_paragraph` | Top of content      | Above fold (avoid)      |
| 110 | `under_second_paragraph`| Early content       | Blog posts              |

## Future Expansion (Phase 2)

Once we validate performance and monitor user experience:

### Priority 1: Medium Traffic Pages
- **State Pages** - ID 113 (`longer_content`)
  - Between city groups (e.g., after first 5 cities)
  - Traffic: 50-90 views per page

- **City Pages** - ID 114 (`longest_content`)
  - After location grid, before nearby locations
  - Traffic: 30-60 views per page

### Priority 2: Enhanced Placements
- **Sidebar Ads** (Desktop only)
  - Consider ID 106 (`sidebar_bottom`) on location pages
  - Requires layout modification to 2-column design

- **Blog Content** (If added)
  - ID 110 (`under_second_paragraph`) for article content
  - ID 115 (`incontent_5`) for longer articles

### Priority 3: Testing & Optimization
- **A/B Testing** - Compare ad positions using Ezoic's testing tools
- **Density Increase** - Carefully add 2nd ad on highest-traffic pages
- **Seasonal Adjustments** - Modify placements based on seasonal traffic patterns

## Performance Monitoring

### Key Metrics to Track

1. **Ad Performance** (Ezoic Dashboard):
   - EPMV (Earnings Per Thousand Visitors)
   - Viewability rates
   - Click-through rates
   - Revenue by placement ID

2. **User Experience** (Google Analytics):
   - Bounce rate changes
   - Time on page changes
   - Pages per session
   - Core Web Vitals (CLS, LCP, FID)

3. **Traffic Patterns**:
   - Monitor if ad placements affect navigation
   - Track button clicks (Get Directions, Call Now)
   - Compare pre/post-ad conversion rates

### Success Criteria

✅ **Maintain or improve:**
- Bounce rate < 70%
- Avg session duration > 1m 30s
- Pages per session > 2.0

✅ **Ad performance targets:**
- EPMV > $5
- Viewability > 60%
- Page load time < 3s

## Implementation Guidelines for Future Changes

### Adding New Ad Placements

1. **Import the component:**
   ```tsx
   import AdPlacement from '@/components/AdPlacement'
   ```

2. **Add to appropriate location:**
   ```tsx
   {/* Ad Placement - Description of placement */}
   <AdPlacement placeholderId={XXX} />
   ```

3. **Use consistent styling:**
   - The component automatically wraps ads in `my-8 max-w-7xl mx-auto px-4`
   - Matches site's content width and spacing

4. **Document the change:**
   - Update this file with new placement details
   - Note traffic expectations and rationale

### Best Practices

- **Server vs Client Components:** Always use `AdPlacement` in client components or client-side rendered sections
- **Placeholder IDs:** Reference Ezoic dashboard for current placeholder names/IDs
- **Testing:** Test on mobile and desktop before deploying
- **Monitoring:** Check Ezoic reports 24-48 hours after new placements go live

## Design Philosophy

### Core Principles

1. **User Experience First** - Ads should never degrade site usability
2. **Value Exchange** - Free content/service in exchange for non-intrusive ads
3. **Incremental Approach** - Start small, measure, expand carefully
4. **Data-Driven** - Use analytics to guide placement decisions
5. **Transparency** - Clear separation between content and advertising

### Content-to-Ad Ratio

**Target:** 90% content / 10% advertising space

**Current Ratio:**
- Location pages: ~95% content / 5% ads (1 ad per page)
- Search pages: ~92% content / 8% ads (1 ad after results)
- Homepage: ~93% content / 7% ads (1 ad mid-page)

This conservative ratio ensures ads feel natural rather than overwhelming.

## Troubleshooting

### Common Issues

**Ads not displaying:**
1. Check Ezoic dashboard - ensure placeholders are active
2. Verify domain verification is complete
3. Check browser console for JavaScript errors
4. Confirm `window.ezstandalone` is loaded

**Hydration errors:**
- Ensure `AdPlacement` component is client-side only (`'use client'`)
- Verify using Next.js `Script` component for Ezoic scripts, not `<script>` tags

**Layout shift (CLS issues):**
- Do NOT pre-allocate space for ads (Ezoic recommendation)
- Let Ezoic handle responsive sizing
- Monitor Core Web Vitals in Google Search Console

## Revenue Estimates

**Conservative Projections** (based on industry averages):

- **EPMV Target:** $5-10 per 1,000 visitors
- **Monthly Traffic:** ~8,000-10,000 page views
- **Estimated Monthly Revenue:** $40-100 (conservative)

**Note:** Actual revenue varies based on:
- Niche/category (automotive/local services)
- Geographic distribution of visitors
- Seasonal traffic patterns
- Ad viewability and engagement

## Compliance & Privacy

- ✅ Privacy scripts loaded (Gatekeeper Consent)
- ✅ GDPR/CCPA compliance via Ezoic's consent management
- ✅ Ads.txt properly configured for authorized sellers
- ✅ No intrusive ad formats (no pop-ups, auto-play video, etc.)

## Contact & Support

**Ezoic Support:** https://support.ezoic.com
**Dashboard:** https://ezoic.com/publisher/dashboard
**Ads.txt Manager:** https://srv.adstxtmanager.com/19390/selfcarwashfinder.com

## Changelog

### 2025-11-08 - Phase 1 Implementation
- ✅ Integrated Ezoic JavaScript standalone
- ✅ Set up ads.txt redirect
- ✅ Created `AdPlacement` component
- ✅ Added 4 strategic placements:
  - Search Results (ID 112)
  - Homepage (ID 111)
  - Near Me (ID 112)
  - Location Detail Pages (ID 111)
- ✅ Traffic coverage: ~78% of site visitors
- ✅ Estimated impressions: ~7,000/month

### Future Updates
- [ ] Monitor performance for 30 days
- [ ] Analyze EPMV and user metrics
- [ ] Consider Phase 2 expansion
- [ ] A/B test alternative placements

---

**Last Updated:** November 8, 2025
**Strategy Owner:** Development Team
**Review Cadence:** Monthly
