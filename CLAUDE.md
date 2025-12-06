# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js 14 directory application for finding dryer vent cleaning services across the United States, deployed on Cloudflare Pages using OpenNext. The site uses Supabase for data storage and features state/city-based navigation with SEO optimization.

## Development Commands

### Running Locally
```bash
npm run dev                  # Start dev server on http://localhost:3003
```

### Building & Deployment
```bash
npm run build               # Standard Next.js build
npm run build:cloudflare    # Build for Cloudflare using OpenNext
npm run clean               # Remove build artifacts (.open-next, .next, dist, out)
npm run deploy:prod         # Build and deploy to production
npm run deploy:staging      # Build and deploy to staging environment
```

### Testing
```bash
npm test                    # Run Jest tests
npm test:watch              # Run tests in watch mode
npm test:coverage           # Run tests with coverage report
```

### Linting
```bash
npm run lint               # Run Next.js ESLint
```

### Data Import
```bash
node scripts/psql_import.js         # Import CSV data to Supabase (requires DATABASE_URL)
node scripts/split_csv.js           # Split sample_data.csv into normalized tables
```

## Architecture

### Routing Structure
The app uses Next.js 14 App Router with the following URL patterns:
- `/` - Homepage
- `/states` - All states listing
- `/states/[state]` - State page showing all cities
- `/states/[state]/[city]/[slug]` - Individual location detail page
- `/cities/[city]` - City page (cross-state aggregation)
- `/search` - Search results page
- `/dryer-vent-cleaning-near-me` - Location-based search
- `/admin/login` - Admin authentication
- `/admin/locations-review` - Admin location approval queue

### Data Layer Architecture

**Primary Database:** Supabase (PostgreSQL)

**Core Tables:**
- `locations` - Main location data with `review_status` field ('pending', 'approved', 'rejected')
- `location_amenities` - Amenities linked to locations via `location_id`
- `location_hours` - Operating hours (7 rows per location, one per day_of_week 0-6)
- `location_claims` - Business owner claim requests
- `location_feedback` - User-submitted feedback/corrections

**Key Database Functions:**
- `locations_within_radius(search_lat, search_lng, radius_miles, exclude_ids)` - RPC function for geospatial search

**Data Queries:**
- All location queries filter by `business_status IN ('OPERATIONAL', 'CLOSED_TEMPORARILY')` and `review_status = 'approved'`
- Location lookups use compound keys: `slug`, `state`, and `city_slug` (not just slug alone)
- State filtering converts slugs to title case: `florida` → `Florida`

**Supabase Client:**
- Singleton client created in `lib/supabase.ts`
- Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Helper function: `getSupabaseClient()`

### Component Organization

**Server Components (default):**
- All page components in `app/` directory
- Fetch data directly from Supabase
- Generate metadata for SEO

**Client Components (marked with 'use client'):**
- `LocationPageClient` - Interactive location page features
- `NearMeClient` - Geolocation-based search
- `Search` - Search autocomplete
- `LocationCard` - Interactive location cards
- `ReportProblemModal` - User feedback form

### Key Utilities

**lib/locationUtils.ts:**
- `calculateDistance(lat1, lon1, lat2, lon2)` - Haversine formula for distance calculation
- `getCoordinatesFromZip(zipCode)` - Fetch lat/lng from zippopotam.us API (with 24hr cache)
- `searchLocationsByZip(zipCode, radiusMiles)` - Search using `locations_within_radius` RPC
- `searchLocationsByLatLng(lat, lng, radiusMiles, excludeIds)` - Geospatial search

**lib/slugify.ts:**
- Custom slugify implementation (note: not the npm package despite being imported)

**lib/timeUtils.ts:**
- Business hours formatting and "open now" status

**lib/stateUtils.ts:**
- State name normalization and URL generation

### Deployment Architecture

**Platform:** Cloudflare Pages with OpenNext adapter

**Build Process:**
1. `npm run clean` removes old artifacts
2. `@opennextjs/cloudflare build` creates `.open-next/` directory
3. Wrangler deploys from `.open-next/worker.js`

**Configuration Files:**
- `wrangler.jsonc` - Cloudflare Worker configuration (worker name: "dryer-vent-cleaners")
- `next.config.js` - Next.js build settings
- `open-next.config.ts` - OpenNext adapter settings
- `package.json` - Project name: "dryer-vent-cleaners"

**Environment Variables:**
- Development: `.env.local` file
- Production: Set in Cloudflare dashboard or via wrangler
- Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Optional: `DATABASE_URL` (for data import scripts only)

### SEO & Performance

**Metadata Generation:**
- Each page generates metadata via `generateMetadata()` async function
- Uses custom `generateSocialPreview()` helper from `components/SocialPreview.tsx`
- Includes OpenGraph, Twitter cards, canonical URLs

**Structured Data:**
- `WebsiteStructuredData` - Schema.org website markup
- `OrganizationStructuredData` - Schema.org organization markup
- Location pages should include LocalBusiness schema

**Performance Optimizations:**
- Next.js image optimization configured for unsplash.com and maps.googleapis.com
- CSS optimization enabled in production
- Console logs removed in production builds
- Security headers configured in `next.config.js`
- Google Analytics (G-MX6CGQHPNF) loaded via Next.js Script component

### Data Import Workflow

1. **Source data:** `sample_data.csv` (large CSV with location data)
2. **Split script:** `node scripts/split_csv.js` creates normalized CSVs in `split_csv/`:
   - `locations.csv`
   - `location_amenities.csv`
   - `location_hours.csv`
3. **Import script:** `node scripts/psql_import.js` uses PostgreSQL COPY commands via staging tables
4. **Enrichment scripts:**
   - `scripts/enrich_with_google_places.js` - Adds Google Places data
   - `scripts/keyword_filter_locations.js` - Filters locations by keywords

**Import Strategy:**
- Uses staging tables to prevent conflicts
- Upserts based on `google_place_id` (unique identifier)
- Generates unique slugs for conflicts using MD5 hash suffix
- Preserves existing data when Google Place IDs match

## Testing

**Framework:** Jest with ts-jest preset

**Test Files:**
- `lib/timeUtils.test.ts` - Time utility tests
- `lib/analytics.test.ts` - Analytics utility tests

**Running Single Tests:**
```bash
npm test -- timeUtils.test.ts
```

## Important Notes

### URL Structure & Slugs
- Location pages require THREE parameters: `[state]/[city]/[slug]`
- State slugs are kebab-case but stored in DB as title case
- City filtering uses `city_slug` column (not `city`)
- Location uniqueness is enforced by composite key: (slug, state, city)

### Admin Features
- Admin login at `/admin/login`
- Location review queue filters by `review_status = 'pending'`
- Approval changes status to 'approved', making location visible on site

### Image Handling
- External images from Unsplash and Google Maps are allowed
- WebP and AVIF formats enabled for optimization
- Responsive sizes configured in `next.config.js`

### Cloudflare Specifics
- Workers use Node.js compatibility mode (`nodejs_compat` flag)
- Global fetch restricted to public URLs only
- No CPU limits on free plan (limits were removed)
- Worker name must match in wrangler.jsonc services binding ("dryer-vent-cleaners")
