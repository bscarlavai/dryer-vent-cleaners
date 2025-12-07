/**
 * Import Dryer Vent Cleaning Locations from SerpAPI
 *
 * This script fetches dryer vent cleaning businesses from SerpAPI's Google Maps API
 * and outputs them to CSV files for import into Supabase.
 *
 * Usage:
 *   # Dry run to see API call count
 *   node scripts/import_from_serpapi.js --location "Indiana, United States" --dry-run
 *
 *   # Fetch and save to CSV
 *   node scripts/import_from_serpapi.js --location "Indiana, United States"
 *
 *   # Limit results (for testing)
 *   node scripts/import_from_serpapi.js --location "Indiana, United States" --limit 20
 *
 *   # Custom search query
 *   node scripts/import_from_serpapi.js --location "Indiana, United States" --query "dryer vent cleaning service"
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const slugify = require('../lib/slugify');

// Configuration
const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY;
const SEARCH_QUERY = 'dryer vent cleaning';
const ZOOM_LEVEL = '11'; // Metro area coverage (optimal for city searches)
const BASE_OUTPUT_DIR = path.join(__dirname, '..', 'serpapi_data');

// Parse command line arguments
const args = process.argv.slice(2);
const locationIndex = args.indexOf('--location');
const LOCATION = locationIndex !== -1 ? args[locationIndex + 1] : null;
const DRY_RUN = args.includes('--dry-run');
const limitIndex = args.indexOf('--limit');
const RESULT_LIMIT = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : null;
const queryIndex = args.indexOf('--query');
const CUSTOM_QUERY = queryIndex !== -1 ? args[queryIndex + 1] : SEARCH_QUERY;

// Validate
if (!SERPAPI_API_KEY) {
  console.error('❌ Missing SERPAPI_API_KEY!');
  console.error('Please set in .env.local:');
  console.error('  SERPAPI_API_KEY=your_api_key_here');
  console.error('\nGet your API key from: https://serpapi.com/manage-api-key');
  process.exit(1);
}

if (!LOCATION) {
  console.error('❌ --location parameter is required!');
  console.error('Usage: node scripts/import_from_serpapi.js --location "Indiana, United States"');
  console.error('\nExamples:');
  console.error('  --location "Indiana, United States"');
  console.error('  --location "Los Angeles, CA"');
  console.error('  --location "Florida, United States"');
  process.exit(1);
}

/**
 * Convert state abbreviation to full name
 */
const STATE_ABBR_TO_NAME = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'DC': 'District of Columbia'
};

function stateAbbrToName(abbr) {
  return STATE_ABBR_TO_NAME[abbr?.toUpperCase()] || abbr;
}

/**
 * Reverse geocode GPS coordinates to get location info
 * Uses Nominatim (OpenStreetMap) free API
 */
async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'dryer-vent-cleaners-app/1.0'
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.address) {
      return null;
    }

    const address = data.address;
    const stateAbbr = address.state_code || address['ISO3166-2-lvl4']?.split('-')[1];
    const state = stateAbbr ? stateAbbrToName(stateAbbr) : (address.state || '');
    const city = address.city || address.town || address.village || address.county || '';
    const postal_code = address.postcode || '';

    if (!state || !city) {
      return null;
    }

    // Build a service area address
    const street_address = `${city}, ${state}${postal_code ? ' ' + postal_code : ''}`;

    return {
      street_address,
      city,
      state,
      postal_code
    };
  } catch (error) {
    console.log(`    ⚠️  Reverse geocoding failed: ${error.message}`);
    return null;
  }
}

/**
 * Parse address string into components
 * Example: "8 N Grant St, Brownsburg, IN 46112, United States"
 */
function parseAddress(addressStr) {
  if (!addressStr) return null;

  // Remove ", United States" suffix
  let cleaned = addressStr.replace(/, United States$/, '').trim();

  // Split by commas
  const parts = cleaned.split(',').map(p => p.trim());

  if (parts.length < 2) {
    // Need at least city and state+zip
    return null;
  }

  // Last part should be "STATE ZIP" or "STATE ZIP-4"
  const lastPart = parts[parts.length - 1];
  const stateZipMatch = lastPart.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);

  if (!stateZipMatch) {
    return null;
  }

  const stateAbbr = stateZipMatch[1];
  const postal_code = stateZipMatch[2];

  // Second to last part is city
  const city = parts[parts.length - 2];

  // Convert state abbreviation to full name
  const state = stateAbbrToName(stateAbbr);

  // street_address should be the FULL address string (with converted state name)
  // Example: "8 N Grant St, Brownsburg, Indiana 46112"
  const street_address = parts.length > 2
    ? `${parts.slice(0, -2).join(', ')}, ${city}, ${state} ${postal_code}`
    : `${city}, ${state} ${postal_code}`;

  return {
    street_address,
    city,
    state,
    postal_code
  };
}

/**
 * Parse open_state to determine business_status
 * Examples: "Temporarily closed", "Permanently closed", "Open", "Closed"
 */
function parseBusinessStatus(openState) {
  if (!openState) {
    return 'OPERATIONAL';
  }

  const state = openState.toLowerCase();

  if (state.includes('permanently closed') || state.includes('permanently close')) {
    return 'CLOSED_PERMANENTLY';
  }

  if (state.includes('temporarily closed') || state.includes('temporarily close')) {
    return 'CLOSED_TEMPORARILY';
  }

  // Default to operational (includes "Open", "Closes at X", etc.)
  return 'OPERATIONAL';
}

/**
 * Convert operating hours to database format
 * Input: {"monday": "7 am–9 pm", "tuesday": "Closed", "wednesday": "Open 24 hours"}
 * Output: Array of {day_of_week, open_time, close_time, is_closed}
 */
function parseOperatingHours(operatingHours) {
  if (!operatingHours) return [];

  const dayMap = {
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6
  };

  const results = [];

  for (const [day, hours] of Object.entries(operatingHours)) {
    const dayOfWeek = dayMap[day.toLowerCase()];
    if (dayOfWeek === undefined) continue;

    let openTime = null;
    let closeTime = null;
    let isClosed = false;

    if (hours === 'Closed') {
      isClosed = true;
    } else if (hours === 'Open 24 hours') {
      openTime = '12:00 AM';
      closeTime = '11:59 PM';
    } else {
      // Parse "7 am–9 pm" format
      const timeMatch = hours.match(/(\d+(?::\d+)?)\s*(am|pm)\s*[–-]\s*(\d+(?::\d+)?)\s*(am|pm)/i);
      if (timeMatch) {
        const [, startTime, startPeriod, endTime, endPeriod] = timeMatch;
        openTime = convertTo12Hour(startTime, startPeriod);
        closeTime = convertTo12Hour(endTime, endPeriod);
      }
    }

    results.push({
      day_of_week: dayOfWeek,
      open_time: openTime,
      close_time: closeTime,
      is_closed: isClosed
    });
  }

  return results;
}

/**
 * Convert time to 12-hour format with AM/PM
 * Input: "7", "pm" -> Output: "07:00 PM"
 */
function convertTo12Hour(time, period) {
  let [hours, minutes] = time.includes(':') ? time.split(':') : [time, '00'];
  hours = parseInt(hours);
  minutes = parseInt(minutes);

  // Format: "07:00 PM"
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period.toUpperCase()}`;
}

/**
 * Extract amenities from extensions
 */
function extractAmenities(extensions, serviceOptions) {
  const amenities = [];

  if (!extensions && !serviceOptions) return amenities;

  // Process service_options object (top-level)
  if (serviceOptions) {
    if (serviceOptions.online_estimates) {
      amenities.push({ name: 'Online Estimates', category: 'Service options' });
    }
    if (serviceOptions.on_site_services) {
      amenities.push({ name: 'On-site Services', category: 'Service options' });
    }
  }

  // Process extensions array
  if (extensions && Array.isArray(extensions)) {
    extensions.forEach(ext => {
      // Service options
      if (ext.service_options) {
        ext.service_options.forEach(opt => {
          const formatted = opt.split('_').map(w =>
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join(' ');
          amenities.push({ name: formatted, category: 'Service options' });
        });
      }

      // Accessibility
      if (ext.accessibility) {
        ext.accessibility.forEach(opt => {
          const formatted = opt.split('-').map(w =>
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join(' ');
          amenities.push({ name: formatted, category: 'Accessibility' });
        });
      }

      // From the business
      if (ext.from_the_business) {
        ext.from_the_business.forEach(opt => {
          amenities.push({ name: opt, category: 'Offerings' });
        });
      }

      // Planning
      if (ext.planning) {
        ext.planning.forEach(opt => {
          const formatted = opt.split(' ').map(w =>
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join(' ');
          amenities.push({ name: formatted, category: 'Planning' });
        });
      }

      // Parking
      if (ext.parking) {
        ext.parking.forEach(opt => {
          const formatted = opt.split(' ').map(w =>
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join(' ');
          amenities.push({ name: formatted, category: 'Parking' });
        });
      }

      // Crowd
      if (ext.crowd) {
        ext.crowd.forEach(opt => {
          const formatted = opt.split(' ').map(w =>
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join(' ');
          amenities.push({ name: formatted, category: 'Crowd' });
        });
      }

      // Amenities
      if (ext.amenities) {
        ext.amenities.forEach(opt => {
          const formatted = opt.split('-').map(w =>
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join(' ');
          amenities.push({ name: formatted, category: 'Amenities' });
        });
      }
    });
  }

  return amenities;
}

/**
 * Extract actual URL from Google redirect URL
 * Example: /url?q=https://example.com&... -> https://example.com
 */
function extractRealUrl(googleUrl) {
  if (!googleUrl) return '';

  // If it's already a direct URL, return it
  if (!googleUrl.startsWith('/url?q=')) {
    return googleUrl;
  }

  try {
    // Parse the redirect URL
    const url = new URL(googleUrl, 'https://google.com');
    const realUrl = url.searchParams.get('q');
    return realUrl || googleUrl;
  } catch (e) {
    // If parsing fails, return original
    return googleUrl;
  }
}

/**
 * Helper to always quote every field (matching split_csv.js)
 */
function quoteAll(field) {
  // Handle null/undefined but preserve 0 and false
  if (field === null || field === undefined) {
    field = '';
  }
  return '"' + String(field).replace(/\n/g, ' ').replace(/\r/g, '').replace(/"/g, '""') + '"';
}

/**
 * Fetch results from SerpAPI
 */
async function fetchFromSerpAPI(query, location, page = 1) {
  const start = (page - 1) * 20; // SerpAPI returns 20 results per page

  const params = new URLSearchParams({
    engine: 'google_maps',
    type: 'search',
    q: query,
    location: location,
    z: ZOOM_LEVEL,
    gl: 'us',
    hl: 'en',
    api_key: SERPAPI_API_KEY,
  });

  if (start > 0) {
    params.append('start', start.toString());
  }

  const url = `https://serpapi.com/search.json?${params}`;

  console.log(`  Fetching page ${page}...`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`SerpAPI request failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    if (data.error.includes("Google hasn't returned any results for this query")) {
      console.warn(`  ⚠️  SerpAPI returned no results for this query on page ${page}. Continuing...`);
      return { local_results: [] }; // Return empty results to continue processing
    } else {
      throw new Error(`SerpAPI error: ${data.error}`);
    }
  }

  return data;
}

/**
 * Save progress to CSV files
 */
function saveProgressToFiles(allLocations, allHours, allAmenities, outputDir) {
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write locations CSV
  const locationsCsv = [
    ['id', 'name', 'slug', 'city_slug', 'website_url', 'phone', 'email', 'street_address', 'city', 'state', 'postal_code', 'country', 'latitude', 'longitude', 'description', 'business_type', 'business_types', 'business_status', 'google_rating',
      'review_count', 'reviews_tags', 'working_hours', 'price_level', 'photo_url', 'logo_url', 'street_view_url', 'reservation_urls', 'booking_appointment_url', 'menu_url', 'order_urls', 'location_url',
      'google_place_id', 'google_id', 'google_verified', 'updated_at', 'serp_payload'],
    ...allLocations.map(location => [
      location.id, location.name, location.slug, location.city_slug, location.website_url, location.phone, location.email,
      location.street_address, location.city, location.state, location.postal_code, location.country, location.latitude,
      location.longitude, location.description, location.business_type, location.business_types, location.business_status,
      location.google_rating, location.review_count, location.reviews_tags, location.working_hours, location.price_level,
      location.photo_url, location.logo_url, location.street_view_url, location.reservation_urls, location.booking_appointment_url,
      location.menu_url, location.order_urls, location.location_url, location.google_place_id, location.google_id,
      location.google_verified, location.updated_at, location.serp_payload
    ])
  ];

  const locationsFile = path.join(outputDir, 'locations.csv');
  fs.writeFileSync(locationsFile, locationsCsv.map(row => row.map(quoteAll).join(',')).join('\n'));

  // Write amenities CSV
  if (allAmenities.length > 0) {
    const amenitiesCsv = [
      ['location_id', 'amenity_name', 'amenity_category'],
      ...allAmenities.map(amenity => [amenity.location_id, amenity.amenity_name, amenity.amenity_category])
    ];
    const amenitiesFile = path.join(outputDir, 'location_amenities.csv');
    fs.writeFileSync(amenitiesFile, amenitiesCsv.map(row => row.map(quoteAll).join(',')).join('\n'));
  }

  // Write hours CSV
  if (allHours.length > 0) {
    const hoursCsv = [
      ['location_id', 'day_of_week', 'open_time', 'close_time', 'is_closed'],
      ...allHours.map(hour => [
        quoteAll(hour.location_id),
        quoteAll(hour.day_of_week),
        quoteAll(hour.open_time),
        quoteAll(hour.close_time),
        (hour.is_closed === 'true' || hour.is_closed === true) ? 'true' : (hour.is_closed === 'false' || hour.is_closed === false ? 'false' : '')
      ])
    ];
    const hoursFile = path.join(outputDir, 'location_hours.csv');
    fs.writeFileSync(hoursFile, hoursCsv.map(row => row.join(',')).join('\n'));
  }
}

/**
 * Main function
 */
async function main() {
  // Create location-specific output directory
  const locationSlug = slugify(LOCATION);
  const OUTPUT_DIR = path.join(BASE_OUTPUT_DIR, locationSlug);

  console.log('='.repeat(60));
  console.log('SerpAPI Google Maps Import');
  console.log('='.repeat(60));
  console.log(`Location: ${LOCATION}`);
  console.log(`Query: ${CUSTOM_QUERY}`);
  console.log(`Zoom Level: ${ZOOM_LEVEL}`);
  console.log(`Output Directory: ${OUTPUT_DIR}`);
  console.log(`Dry Run: ${DRY_RUN ? 'YES (no files will be written)' : 'NO (will write CSV files)'}`);
  if (RESULT_LIMIT) {
    console.log(`Result Limit: ${RESULT_LIMIT}`);
  }
  console.log('='.repeat(60) + '\n');

  try {
    let allLocations = [];
    let allHours = [];
    let allAmenities = [];
    let page = 1;
    let hasMore = true;
    let apiCallCount = 0;

    while (hasMore) {
      const data = await fetchFromSerpAPI(CUSTOM_QUERY, LOCATION, page);
      apiCallCount++;

      const results = data.local_results || [];
      console.log(`  Found ${results.length} results on page ${page}`);

      if (results.length === 0) {
        hasMore = false;
        break;
      }

      // Process each location
      for (const result of results) {
        // Parse address
        let addressParts = parseAddress(result.address);

        // If address parsing failed but we have GPS coordinates, try reverse geocoding
        if (!addressParts && result.gps_coordinates?.latitude && result.gps_coordinates?.longitude) {
          console.log(`  🌍 No address for ${result.title}, trying reverse geocoding...`);
          addressParts = await reverseGeocode(result.gps_coordinates.latitude, result.gps_coordinates.longitude);

          if (addressParts) {
            console.log(`     ✓ Determined location: ${addressParts.city}, ${addressParts.state}`);
          }

          // Small delay to respect Nominatim rate limits (1 request per second)
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (!addressParts) {
          console.log(`  ⚠️  Skipping ${result.title} - could not parse address: ${result.address}`);
          continue;
        }

        // Generate UUID for this location
        const locationId = crypto.randomUUID();
        const locationSlug = slugify(result.title);
        const citySlug = slugify(addressParts.city);

        // Create location record matching split_csv.js format
        const location = {
          id: locationId,
          name: result.title,
          slug: locationSlug,
          city_slug: citySlug,
          website_url: extractRealUrl(result.website),
          phone: result.phone || '',
          email: '',
          street_address: addressParts.street_address,
          city: addressParts.city,
          state: addressParts.state,
          postal_code: addressParts.postal_code,
          country: 'United States',
          latitude: result.gps_coordinates?.latitude || '',
          longitude: result.gps_coordinates?.longitude || '',
          description: result.description || '',
          business_type: result.type || result.types?.[0] || '',
          business_types: result.types && result.types.length > 0
            ? `{${result.types.map(t => `"${t.replace(/"/g, '\\"')}"`).join(',')}}`
            : '',
          business_status: parseBusinessStatus(result.open_state),
          google_rating: result.rating || '',
          review_count: result.reviews || '',
          reviews_tags: '',
          working_hours: '', // We store hours in separate table
          price_level: '',
          photo_url: '', // Will use separate images API later
          logo_url: '',
          street_view_url: '',
          reservation_urls: '',
          booking_appointment_url: result.book_online || '',
          menu_url: '',
          order_urls: '',
          location_url: `https://www.google.com/maps/place/?q=place_id:${result.place_id}`,
          google_place_id: result.place_id,
          google_id: result.provider_id || '',
          google_verified: '',
          updated_at: new Date().toISOString(),
          serp_payload: JSON.stringify(result)
        };

        allLocations.push(location);

        // Parse hours
        if (result.operating_hours) {
          const hours = parseOperatingHours(result.operating_hours);
          hours.forEach(h => {
            allHours.push({
              location_id: locationId,
              ...h
            });
          });
        }

        // Extract amenities
        const amenities = extractAmenities(result.extensions, result.service_options);
        amenities.forEach(amenity => {
          allAmenities.push({
            location_id: locationId,
            amenity_name: amenity.name,
            amenity_category: amenity.category
          });
        });

        // Check limit
        if (RESULT_LIMIT && allLocations.length >= RESULT_LIMIT) {
          hasMore = false;
          break;
        }
      }

      // Save progress after each page (in case of failure)
      if (!DRY_RUN && allLocations.length > 0) {
        saveProgressToFiles(allLocations, allHours, allAmenities, OUTPUT_DIR);
      }

      // Check for pagination
      if (data.serpapi_pagination?.next && hasMore) {
        page++;
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        hasMore = false;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Summary:');
    console.log('='.repeat(60));
    console.log(`Total API calls: ${apiCallCount} (counts against your 250/month limit)`);
    console.log(`Total locations: ${allLocations.length}`);
    console.log(`Total hours records: ${allHours.length}`);
    console.log(`Total amenities records: ${allAmenities.length}`);

    if (DRY_RUN) {
      console.log('\n⚠️  This was a DRY RUN - no files were written');
      console.log('Run without --dry-run to save CSV files');
    } else {
      // Final save (already saved incrementally after each page)
      saveProgressToFiles(allLocations, allHours, allAmenities, OUTPUT_DIR);

      console.log(`\n✓ Wrote ${path.join(OUTPUT_DIR, 'locations.csv')}`);
      if (allAmenities.length > 0) {
        console.log(`✓ Wrote ${path.join(OUTPUT_DIR, 'location_amenities.csv')}`);
      }
      if (allHours.length > 0) {
        console.log(`✓ Wrote ${path.join(OUTPUT_DIR, 'location_hours.csv')}`);
      }

      console.log('\n📁 Files saved to: ' + OUTPUT_DIR);
      console.log('\nNext steps:');
      console.log('1. Review the CSV files');
      console.log(`2. Import to database using: node scripts/serpapi_psql_import.js ${locationSlug}`);
    }

    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
