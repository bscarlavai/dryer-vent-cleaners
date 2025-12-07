/**
 * Migrate Photos from SerpAPI to Cloudflare Images
 *
 * This script:
 * 1. Fetches locations with serp_payload from database
 * 2. Extracts thumbnail URL from serp_payload (no additional API calls!)
 * 3. Downloads the thumbnail image
 * 4. Uploads to Cloudflare Images
 * 5. Stores image reference in location_images table
 *
 * Usage:
 *   # Test with first 2 locations
 *   node scripts/migrate_serpapi_photos.js --limit 2
 *
 *   # Run full migration
 *   node scripts/migrate_serpapi_photos.js
 *
 *   # Start from specific location
 *   node scripts/migrate_serpapi_photos.js --start-after <location-id>
 */

const { createClient } = require('@supabase/supabase-js');
const FormData = require('form-data');
const fs = require('fs');
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

const BATCH_SIZE = 10; // Process 10 locations at a time (increased since no API rate limits)
const DELAY_MS = 1000; // 1 second delay between batches

// Validate environment variables (no SerpAPI key needed!)

if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_IMAGES_API_TOKEN) {
  console.error('❌ Missing Cloudflare credentials!');
  console.error('Please set in .env.local:');
  console.error('  CLOUDFLARE_ACCOUNT_ID');
  console.error('  CLOUDFLARE_IMAGES_API_TOKEN');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Extract thumbnail URL from serp_payload
 */
function getThumbnailFromPayload(serpPayload) {
  // The payload has a thumbnail field with the Google Maps image URL
  // Example: "https://lh3.googleusercontent.com/p/AF1QipPnA2qKRkdKVWWb0XoCv0wmqnfrxTShx08y54iw=w174-h92-k-no"

  if (serpPayload.thumbnail) {
    // Optionally increase resolution by changing the size parameters
    // w174-h92 is small, so let's request a larger version
    const url = serpPayload.thumbnail;
    // Change w174-h92 to w800-h600 for better quality
    return url.replace(/w\d+-h\d+/, 'w800-h600');
  }

  return null;
}

/**
 * Download image from URL to buffer
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

  const response = await fetch(imageUrl, fetchOptions);

  if (!response.ok) {
    throw new Error(`Failed to download image: HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Upload image buffer to Cloudflare Images
 */
async function uploadImageToCloudflare(imageBuffer, metadata) {
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
 * Upload a single photo with retry logic
 */
async function uploadPhoto(imageUrl, metadata, retries = 2) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const imageBuffer = await downloadImageToBuffer(imageUrl);
      const cfImageId = await uploadImageToCloudflare(imageBuffer, metadata);
      return cfImageId;

    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

/**
 * Process photos for a single location
 */
async function processLocation(location, stats) {
  const locationName = location.name.substring(0, 50);
  console.log(`\n📍 Processing: ${locationName} (${location.city}, ${location.state})`);

  try {
    // Parse serp_payload
    const serpPayload = typeof location.serp_payload === 'string'
      ? JSON.parse(location.serp_payload)
      : location.serp_payload;

    if (!serpPayload) {
      console.log('  ⚠️  No serp_payload');
      stats.skipped++;
      return;
    }

    // Check if location already has photos
    const { data: existingPhotos } = await supabase
      .from('location_images')
      .select('id')
      .eq('location_id', location.id)
      .limit(1);

    if (existingPhotos && existingPhotos.length > 0) {
      console.log('  ⊙ Already has photos (skipping)');
      stats.alreadyMigrated++;
      return;
    }

    // Extract thumbnail from serp_payload (no API call needed!)
    const imageUrl = getThumbnailFromPayload(serpPayload);

    if (!imageUrl) {
      console.log('  ⚠️  No thumbnail in serp_payload');
      stats.skipped++;
      return;
    }

    console.log(`  📸 Using thumbnail from serp_payload...`);

    let uploadedCount = 0;

    try {
      console.log(`    ⬆️  Uploading photo...`);

      const cfImageId = await uploadPhoto(imageUrl, {
        site: 'dryer-vent-cleaners',
        location_id: location.id,
        location_name: location.name,
        type: 'photo',
        source: 'serpapi-thumbnail',
        position: 1,
      });

      // Store in database
      const { error: insertError } = await supabase
        .from('location_images')
        .insert({
          location_id: location.id,
          cf_image_id: cfImageId,
          image_type: 'photo',
          is_primary: true, // Single photo is primary
          uploaded_by: 'serpapi-migration',
          source_url: imageUrl,
        });

      if (insertError) {
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      console.log(`    ✓ Photo uploaded (ID: ${cfImageId.substring(0, 12)}...)`);
      uploadedCount++;
      stats.photosUploaded++;

    } catch (error) {
      console.error(`    ✗ Failed to upload photo: ${error.message}`);
      stats.photosFailed++;
    }

    if (uploadedCount > 0) {
      console.log(`  ✓ Successfully uploaded photo`);
      stats.migrated++;
    } else {
      console.log('  ✗ Photo upload failed');
      stats.failed++;
    }

  } catch (error) {
    console.error(`  ✗ Failed to process location: ${error.message}`);
    stats.failed++;
    stats.failedLocations.push({
      location_id: location.id,
      location_name: location.name,
      error: error.message,
    });
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Starting SerpAPI Photos Migration\n');
  console.log('Configuration:');
  console.log(`  Limit: ${LIMIT || 'No limit'}`);
  console.log(`  Start after: ${START_AFTER || 'Beginning'}`);
  console.log(`  Photos per location: 1 (thumbnail from serp_payload)`);
  console.log(`  Batch size: ${BATCH_SIZE}`);
  console.log(`  Delay: ${DELAY_MS}ms between batches`);
  console.log(`  🎉 Zero SerpAPI calls needed!\n`);

  const stats = {
    total: 0,
    migrated: 0,
    alreadyMigrated: 0,
    skipped: 0,
    failed: 0,
    photosUploaded: 0,
    photosFailed: 0,
    failedLocations: [],
  };

  try {
    // Fetch locations with serp_payload
    console.log('🔍 Fetching locations with serp_payload...');
    const allLocations = [];
    let page = 0;
    const PAGE_SIZE = 1000;

    while (true) {
      let query = supabase
        .from('locations')
        .select('id, name, city, state, serp_payload')
        .not('serp_payload', 'is', null)
        .order('created_at', { ascending: true })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (START_AFTER && page === 0) {
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
      console.log(`  📄 Fetched page ${page + 1} (${pageLocations.length} records, ${allLocations.length} total)`);

      if (pageLocations.length < PAGE_SIZE) {
        break;
      }

      page++;
    }

    if (allLocations.length === 0) {
      console.log('No locations found with serp_payload.');
      return;
    }

    console.log(`✓ Found ${allLocations.length} locations with serp_payload\n`);

    // Apply limit
    const locations = LIMIT ? allLocations.slice(0, LIMIT) : allLocations;

    console.log(`📝 Processing ${locations.length} locations`);
    console.log('─'.repeat(60));

    stats.total = locations.length;

    // Process in batches
    for (let i = 0; i < locations.length; i += BATCH_SIZE) {
      const batch = locations.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(locations.length / BATCH_SIZE);

      console.log(`\n📦 Batch ${batchNum}/${totalBatches}`);

      for (const location of batch) {
        await processLocation(location, stats);
      }

      // Delay between batches
      if (i + BATCH_SIZE < locations.length) {
        console.log(`\n⏱️  Waiting ${DELAY_MS / 1000}s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('📊 Migration Summary');
    console.log('═'.repeat(60));
    console.log(`Total locations processed: ${stats.total}`);
    console.log(`✓ Locations migrated: ${stats.migrated}`);
    console.log(`⊙ Already had photos: ${stats.alreadyMigrated}`);
    console.log(`⚠ Skipped (no photos): ${stats.skipped}`);
    console.log(`✗ Failed: ${stats.failed}`);
    console.log(`📸 Photos uploaded: ${stats.photosUploaded}`);
    console.log(`✗ Photos failed: ${stats.photosFailed}`);

    if (stats.failedLocations.length > 0) {
      console.log('\n❌ Failed Locations:');
      stats.failedLocations.forEach(fail => {
        console.log(`  - ${fail.location_name}: ${fail.error}`);
      });

      const failedFile = 'serpapi-photos-failed.json';
      fs.writeFileSync(failedFile, JSON.stringify(stats.failedLocations, null, 2));
      console.log(`\n💾 Failed locations saved to: ${failedFile}`);
    }

    if (LIMIT) {
      const lastLocationId = locations[locations.length - 1].id;
      console.log(`\nℹ️  To continue migration, run:`);
      console.log(`   node scripts/migrate_serpapi_photos.js --start-after ${lastLocationId}`);
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
