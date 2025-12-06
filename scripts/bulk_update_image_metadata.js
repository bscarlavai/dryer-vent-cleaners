/**
 * Bulk Update Cloudflare Images Metadata
 *
 * This script updates existing Cloudflare Images to add the 'site' metadata tag.
 *
 * Usage:
 *   # Dry run (see what would be updated)
 *   node scripts/bulk_update_image_metadata.js --dry-run
 *
 *   # Update all images for a specific site
 *   node scripts/bulk_update_image_metadata.js --site self-car-wash-finder
 *   node scripts/bulk_update_image_metadata.js --site dryer-vent-cleaners
 *
 *   # Update a specific image by ID
 *   node scripts/bulk_update_image_metadata.js --image-id abc123 --site self-car-wash-finder
 */

require('dotenv').config({ path: '.env.local' });

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_IMAGES_API_TOKEN = process.env.CLOUDFLARE_IMAGES_API_TOKEN;

// Parse command line arguments
const args = process.argv.slice(2);
const siteIndex = args.indexOf('--site');
const SITE_NAME = siteIndex !== -1 ? args[siteIndex + 1] : null;
const imageIdIndex = args.indexOf('--image-id');
const IMAGE_ID = imageIdIndex !== -1 ? args[imageIdIndex + 1] : null;
const DRY_RUN = args.includes('--dry-run');

// Validate
if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_IMAGES_API_TOKEN) {
  console.error('❌ Missing Cloudflare credentials!');
  console.error('Please set in .env.local:');
  console.error('  CLOUDFLARE_ACCOUNT_ID');
  console.error('  CLOUDFLARE_IMAGES_API_TOKEN');
  process.exit(1);
}

if (!SITE_NAME) {
  console.error('❌ --site parameter is required!');
  console.error('Usage: node scripts/bulk_update_image_metadata.js --site <site-name>');
  console.error('Example: node scripts/bulk_update_image_metadata.js --site self-car-wash-finder');
  process.exit(1);
}

const validSites = ['self-car-wash-finder', 'dryer-vent-cleaners'];
if (!validSites.includes(SITE_NAME)) {
  console.error(`❌ Invalid site name: ${SITE_NAME}`);
  console.error(`Valid options: ${validSites.join(', ')}`);
  process.exit(1);
}

/**
 * List all images in Cloudflare Images account
 */
async function listAllImages() {
  let allImages = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1?page=${page}&per_page=100`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_IMAGES_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list images: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`Cloudflare API error: ${JSON.stringify(data.errors)}`);
    }

    // Debug: log the response structure on first page
    if (page === 1) {
      console.log('  Debug - API response structure:', JSON.stringify({
        success: data.success,
        result_keys: Object.keys(data.result || {}),
        result_info: data.result_info,
        images_count: data.result?.images?.length,
      }, null, 2));
    }

    allImages = allImages.concat(data.result.images);

    // Check if there are more pages
    // The API returns images array, we need to check if we got a full page
    const imagesInThisPage = data.result.images.length;

    console.log(`  Fetched page ${page}: ${imagesInThisPage} images (${allImages.length} total so far)`);

    // If we got fewer images than requested, we're on the last page
    hasMore = imagesInThisPage === 100;
    page++;
  }

  return allImages;
}

/**
 * Get details for a specific image
 */
async function getImageDetails(imageId) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_IMAGES_API_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get image details: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Cloudflare API error: ${JSON.stringify(data.errors)}`);
  }

  return data.result;
}

/**
 * Update image metadata
 */
async function updateImageMetadata(imageId, metadata) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_IMAGES_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ metadata }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update image: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Cloudflare API error: ${JSON.stringify(data.errors)}`);
  }

  return data.result;
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Cloudflare Images Metadata Bulk Update');
  console.log('='.repeat(60));
  console.log(`Site: ${SITE_NAME}`);
  console.log(`Dry Run: ${DRY_RUN ? 'YES (no changes will be made)' : 'NO (will update images)'}`);
  console.log('='.repeat(60) + '\n');

  try {
    let imagesToUpdate = [];

    if (IMAGE_ID) {
      // Update single image
      console.log(`Fetching image: ${IMAGE_ID}...`);
      const image = await getImageDetails(IMAGE_ID);
      imagesToUpdate = [image];
    } else {
      // Update all images
      console.log('Fetching all images from Cloudflare...');
      const allImages = await listAllImages();
      console.log(`Found ${allImages.length} total images\n`);

      // Filter images that don't have the 'site' metadata or have incorrect site
      imagesToUpdate = allImages.filter(image => {
        const currentSite = image.meta?.site || image.metadata?.site;
        return !currentSite || currentSite !== SITE_NAME;
      });

      console.log(`Found ${imagesToUpdate.length} images to update\n`);
    }

    if (imagesToUpdate.length === 0) {
      console.log('✓ No images need updating!');
      return;
    }

    let updated = 0;
    let failed = 0;

    for (const image of imagesToUpdate) {
      const imageId = image.id;
      const currentMetadata = image.meta || image.metadata || {};

      // Merge existing metadata with new site tag
      const newMetadata = {
        ...currentMetadata,
        site: SITE_NAME,
      };

      console.log(`\nImage ID: ${imageId}`);
      console.log(`  Current metadata: ${JSON.stringify(currentMetadata)}`);
      console.log(`  New metadata: ${JSON.stringify(newMetadata)}`);

      if (DRY_RUN) {
        console.log('  [DRY RUN] Would update this image');
        updated++;
      } else {
        try {
          await updateImageMetadata(imageId, newMetadata);
          console.log('  ✓ Updated successfully');
          updated++;
        } catch (error) {
          console.error(`  ❌ Failed: ${error.message}`);
          failed++;
        }
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(60));
    console.log('Summary:');
    console.log('='.repeat(60));
    console.log(`Total images processed: ${imagesToUpdate.length}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Failed: ${failed}`);

    if (DRY_RUN) {
      console.log('\n⚠️  This was a DRY RUN - no changes were made');
      console.log('Run without --dry-run to actually update the images');
    }

    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
