/**
 * Migrate Google Images to Cloudflare Images
 *
 * This script:
 * 1. Fetches locations from Supabase
 * 2. Uploads their Google images to Cloudflare Images
 * 3. Stores Cloudflare image IDs in location_images table
 *
 * Usage:
 *   # Test with first 2 locations
 *   node scripts/migrate_to_cloudflare_images.js --limit 2
 *
 *   # Run full migration (URL-based: Cloudflare fetches directly)
 *   node scripts/migrate_to_cloudflare_images.js
 *
 *   # Use local download mode (download locally, then upload)
 *   node scripts/migrate_to_cloudflare_images.js --download-local
 *
 *   # Resume from a specific location ID
 *   node scripts/migrate_to_cloudflare_images.js --start-after <location-id>
 *
 *   # Retry failed images with local download and proxy
 *   node scripts/migrate_to_cloudflare_images.js --download-local --proxy http://proxy-host:port
 *   node scripts/migrate_to_cloudflare_images.js --download-local --proxy http://username:password@proxy-host:port
 */

const { createClient } = require('@supabase/supabase-js');
const FormData = require('form-data');
const fs = require('fs');
const { HttpsProxyAgent } = require('https-proxy-agent');
require('dotenv').config({ path: '.env.local' });

// Configuration
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_IMAGES_API_TOKEN = process.env.CLOUDFLARE_IMAGES_API_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Parse command line arguments
const args = process.argv.slice(2);
const limitIndex = args.indexOf('--limit');
const LIMIT = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : null;
const startAfterIndex = args.indexOf('--start-after');
const START_AFTER = startAfterIndex !== -1 ? args[startAfterIndex + 1] : null;
const DOWNLOAD_LOCAL = args.includes('--download-local');
const proxyIndex = args.indexOf('--proxy');
const PROXY_URL = proxyIndex !== -1 ? args[proxyIndex + 1] : null;

const BATCH_SIZE = 5; // Process 5 locations at a time
const DELAY_MS = 2000; // 2 second delay between batches to avoid rate limits

// Create proxy agent if proxy URL is provided
const proxyAgent = PROXY_URL ? new HttpsProxyAgent(PROXY_URL) : null;

// Validate environment variables
if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_IMAGES_API_TOKEN) {
  console.error('❌ Missing Cloudflare credentials!');
  console.error('Please set in .env.local:');
  console.error('  CLOUDFLARE_ACCOUNT_ID');
  console.error('  CLOUDFLARE_IMAGES_API_TOKEN');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please set in .env.local:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Download image from URL to buffer
 * Uses proper headers to avoid 403 blocks from Google
 */
async function downloadImageToBuffer(imageUrl) {
  const fetchOptions = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.google.com/',
    },
  };

  // Add proxy agent if configured
  if (proxyAgent) {
    fetchOptions.agent = proxyAgent;
  }

  const response = await fetch(imageUrl, fetchOptions);

  if (!response.ok) {
    throw new Error(`Failed to download image: HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Upload to Cloudflare via URL (Cloudflare fetches the image directly)
 */
async function uploadImageViaUrl(imageUrl, metadata) {
  const formData = new FormData();
  formData.append('url', imageUrl);

  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }

  // Convert FormData stream to Buffer for Node.js fetch compatibility
  const formHeaders = formData.getHeaders();
  const formDataBuffer = await new Promise((resolve, reject) => {
    const chunks = [];
    formData.on('data', chunk => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    formData.on('end', () => resolve(Buffer.concat(chunks)));
    formData.on('error', reject);
    formData.resume();
  });

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_IMAGES_API_TOKEN}`,
        ...formHeaders,
      },
      body: formDataBuffer,
    }
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    const errorMsg = result.errors?.map(e => e.message).join(', ') || `HTTP ${response.status}`;

    // Check if it's a 403 from Google blocking Cloudflare
    if (errorMsg.includes('403')) {
      throw new Error(`403 Forbidden - Google blocked Cloudflare from fetching image`);
    }

    throw new Error(errorMsg);
  }

  return result.result.id;
}

/**
 * Upload to Cloudflare via buffer (download locally first, then upload)
 */
async function uploadImageViaBuffer(imageUrl, metadata) {
  const imageBuffer = await downloadImageToBuffer(imageUrl);

  const formData = new FormData();
  formData.append('file', imageBuffer, {
    filename: 'image.jpg',
    contentType: 'image/jpeg',
  });

  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }

  // Convert FormData stream to Buffer for Node.js fetch compatibility
  const formHeaders = formData.getHeaders();
  const formDataBuffer = await new Promise((resolve, reject) => {
    const chunks = [];
    formData.on('data', chunk => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    formData.on('end', () => resolve(Buffer.concat(chunks)));
    formData.on('error', reject);
    formData.resume();
  });

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_IMAGES_API_TOKEN}`,
        ...formHeaders,
      },
      body: formDataBuffer,
    }
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    const errorMsg = result.errors?.map(e => e.message).join(', ') || `HTTP ${response.status}`;
    throw new Error(errorMsg);
  }

  return result.result.id;
}

/**
 * Upload an image to Cloudflare Images (with retry logic)
 * Dispatches to URL-based or buffer-based upload depending on DOWNLOAD_LOCAL flag
 */
async function uploadImageFromUrl(imageUrl, metadata, retries = 0) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      if (DOWNLOAD_LOCAL) {
        // Download locally first, then upload (avoids 403s from Google)
        return await uploadImageViaBuffer(imageUrl, metadata);
      } else {
        // Let Cloudflare fetch directly from URL
        return await uploadImageViaUrl(imageUrl, metadata);
      }
    } catch (error) {
      lastError = error;

      // For URL mode: retry on 403 errors
      // For buffer mode: retry on network/5xx errors
      const shouldRetry = attempt < retries && (
        (!DOWNLOAD_LOCAL && error.message.includes('403')) ||
        (DOWNLOAD_LOCAL && (error.message.includes('fetch') || error.message.includes('5')))
      );

      if (shouldRetry) {
        continue;
      }

      // For other errors, fail immediately
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  // All retries exhausted
  throw new Error(`Failed to upload image after ${retries + 1} attempts: ${lastError.message}`);
}

/**
 * Check if an image has already been migrated
 */
async function isImageMigrated(locationId, imageType) {
  const { data, error } = await supabase
    .from('location_images')
    .select('id')
    .eq('location_id', locationId)
    .eq('image_type', imageType)
    .eq('is_primary', true)
    .limit(1);

  if (error) {
    console.error(`Error checking if image exists:`, error);
    return false;
  }

  return data && data.length > 0;
}

/**
 * Normalize Google image URL by removing query parameters
 * This ensures we detect duplicates even if they have different size params
 * e.g., both "...=w800-h500" and "...=w1600-h1000" become "..."
 */
function normalizeImageUrl(url) {
  if (!url) return '';
  // For Google images, remove everything after the '=' (size parameters)
  const equalsIndex = url.indexOf('=');
  return equalsIndex !== -1 ? url.substring(0, equalsIndex) : url;
}

/**
 * Migrate images for a single location
 */
async function migrateLocation(location, stats) {
  const locationName = location.name.substring(0, 50); // Truncate for logging
  console.log(`\n📍 Processing: ${locationName} (${location.city}, ${location.state})`);

  const imagesToMigrate = [];

  // Collect unique images to migrate
  // Use normalized URLs as keys to detect duplicates, but store original URLs for upload
  const imageMap = new Map();

  if (location.photo_url) {
    const normalizedUrl = normalizeImageUrl(location.photo_url);
    imageMap.set(normalizedUrl, {
      originalUrl: location.photo_url,
      type: 'photo'
    });
  }

  if (location.street_view_url) {
    const normalizedUrl = normalizeImageUrl(location.street_view_url);
    // Only add if it's a different image (based on normalized URL)
    if (!imageMap.has(normalizedUrl)) {
      imageMap.set(normalizedUrl, {
        originalUrl: location.street_view_url,
        type: 'street_view'
      });
    }
  }

  // Skip logo for now - typically lower quality
  // if (location.logo_url) {
  //   const normalizedUrl = normalizeImageUrl(location.logo_url);
  //   if (!imageMap.has(normalizedUrl)) {
  //     imageMap.set(normalizedUrl, {
  //       originalUrl: location.logo_url,
  //       type: 'logo'
  //     });
  //   }
  // }

  if (imageMap.size === 0) {
    console.log('  ⚠️  No images to migrate');
    stats.skipped++;
    return;
  }

  // Upload each unique image
  for (const [normalizedUrl, imageData] of imageMap.entries()) {
    const { originalUrl, type: imageType } = imageData;

    try {
      // Check if already migrated
      if (await isImageMigrated(location.id, imageType)) {
        console.log(`  ✓ ${imageType} already migrated (skipping)`);
        stats.alreadyMigrated++;
        continue;
      }

      console.log(`  ⬆️  Uploading ${imageType}...`);

      const cfImageId = await uploadImageFromUrl(originalUrl, {
        location_id: location.id,
        location_name: location.name,
        type: imageType,
      });

      // Store in database
      const { error: insertError } = await supabase
        .from('location_images')
        .insert({
          location_id: location.id,
          cf_image_id: cfImageId,
          image_type: imageType,
          is_primary: true,
          uploaded_by: 'system',
          source_url: originalUrl,
        });

      if (insertError) {
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      console.log(`  ✓ ${imageType} migrated successfully (ID: ${cfImageId.substring(0, 12)}...)`);
      stats.migrated++;

    } catch (error) {
      console.error(`  ✗ Failed to migrate ${imageType}: ${error.message}`);
      stats.failed++;

      // Log failed migrations to a file for later retry
      stats.failedLocations.push({
        location_id: location.id,
        location_name: location.name,
        image_type: imageType,
        error: error.message,
      });
    }
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Starting Cloudflare Images migration\n');
  console.log('Configuration:');
  console.log(`  Mode: ${DOWNLOAD_LOCAL ? 'Local download (fetch locally, then upload)' : 'URL-based (Cloudflare fetches directly)'}`);
  console.log(`  Proxy: ${PROXY_URL || 'None (direct connection)'}`);
  console.log(`  Limit: ${LIMIT || 'No limit (full migration)'}`);
  console.log(`  Start after: ${START_AFTER || 'Beginning'}`);
  console.log(`  Batch size: ${BATCH_SIZE}`);
  console.log(`  Delay: ${DELAY_MS}ms between batches\n`);

  const stats = {
    total: 0,
    migrated: 0,
    alreadyMigrated: 0,
    skipped: 0,
    failed: 0,
    failedLocations: [],
  };

  try {
    // Paginate through location_images to get all migrated location IDs
    console.log('🔍 Fetching migrated location IDs...');
    const migratedIds = new Set();
    let migratedPage = 0;
    const PAGE_SIZE = 1000;

    while (true) {
      const { data: migratedLocationIds, error: migratedError } = await supabase
        .from('location_images')
        .select('location_id')
        .range(migratedPage * PAGE_SIZE, (migratedPage + 1) * PAGE_SIZE - 1);

      if (migratedError) {
        console.error('Error fetching migrated images:', migratedError);
        throw new Error(`Failed to fetch migrated images: ${migratedError.message}`);
      }

      if (!migratedLocationIds || migratedLocationIds.length === 0) {
        break;
      }

      migratedLocationIds.forEach(img => migratedIds.add(img.location_id));
      console.log(`  📄 Fetched page ${migratedPage + 1} (${migratedLocationIds.length} records, ${migratedIds.size} unique locations)`);

      if (migratedLocationIds.length < PAGE_SIZE) {
        break; // Last page
      }

      migratedPage++;
    }

    console.log(`✓ Found ${migratedIds.size} locations with images already migrated\n`);

    // Paginate through locations with images
    console.log('🔍 Fetching locations with images...');
    const allLocations = [];
    let locationsPage = 0;

    while (true) {
      let query = supabase
        .from('locations')
        .select('id, name, city, state, photo_url, logo_url, street_view_url')
        .or('photo_url.not.is.null,street_view_url.not.is.null')
        .order('created_at', { ascending: true })
        .range(locationsPage * PAGE_SIZE, (locationsPage + 1) * PAGE_SIZE - 1);

      if (START_AFTER && locationsPage === 0) {
        query = query.gt('id', START_AFTER);
      }

      const { data: pageLocations, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch locations: ${error.message}`);
      }

      if (!pageLocations || pageLocations.length === 0) {
        break;
      }

      allLocations.push(...pageLocations);
      console.log(`  📄 Fetched page ${locationsPage + 1} (${pageLocations.length} records, ${allLocations.length} total)`);

      if (pageLocations.length < PAGE_SIZE) {
        break; // Last page
      }

      locationsPage++;
    }

    if (allLocations.length === 0) {
      console.log('No locations found to migrate.');
      return;
    }

    console.log(`✓ Found ${allLocations.length} total locations with images\n`);

    // Filter out locations that have any images already migrated
    console.log('🔍 Filtering locations...');
    const locationsToMigrate = allLocations.filter(location => !migratedIds.has(location.id));

    const skippedCount = allLocations.length - locationsToMigrate.length;
    if (skippedCount > 0) {
      console.log(`  ⊙ Skipping ${skippedCount} locations (already have images in location_images)`);
    }

    if (locationsToMigrate.length === 0) {
      console.log('✅ All locations with images have already been migrated!');
      return;
    }

    // Apply limit after filtering
    const locations = LIMIT ? locationsToMigrate.slice(0, LIMIT) : locationsToMigrate;

    console.log(`\n📝 Processing ${locations.length} locations`);
    console.log('─'.repeat(60));

    stats.total = locations.length;

    // Process in batches
    for (let i = 0; i < locations.length; i += BATCH_SIZE) {
      const batch = locations.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(locations.length / BATCH_SIZE);

      console.log(`\n📦 Batch ${batchNum}/${totalBatches}`);

      // Process batch sequentially to be nice to APIs
      for (const location of batch) {
        await migrateLocation(location, stats);
      }

      // Delay between batches (except for last batch)
      if (i + BATCH_SIZE < locations.length) {
        console.log(`\n⏱️  Waiting ${DELAY_MS / 1000}s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('📊 Migration Summary');
    console.log('═'.repeat(60));
    console.log(`Total locations processed: ${stats.total}`);
    console.log(`✓ Images migrated: ${stats.migrated}`);
    console.log(`⊙ Already migrated: ${stats.alreadyMigrated}`);
    console.log(`⚠ Skipped (no images): ${stats.skipped}`);
    console.log(`✗ Failed: ${stats.failed}`);

    if (stats.failedLocations.length > 0) {
      console.log('\n❌ Failed Locations:');
      stats.failedLocations.forEach(fail => {
        console.log(`  - ${fail.location_name} (${fail.image_type}): ${fail.error}`);
      });

      // Save failed locations to a file for manual review
      const failedFile = 'migration-failed-images.json';
      fs.writeFileSync(failedFile, JSON.stringify(stats.failedLocations, null, 2));
      console.log(`\n💾 Failed images saved to: ${failedFile}`);
      console.log('ℹ️  Failed images will continue using Google images as fallback.');

      if (!DOWNLOAD_LOCAL) {
        console.log('ℹ️  To retry failed images with local download mode, run:');
        console.log('   node scripts/migrate_to_cloudflare_images.js --download-local');
      }
    }

    if (LIMIT) {
      const lastLocationId = locations[locations.length - 1].id;
      console.log(`\nℹ️  To continue migration, run:`);
      console.log(`   node scripts/migrate_to_cloudflare_images.js --start-after ${lastLocationId}`);
    }

    console.log('\n✅ Migration complete!\n');

  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
