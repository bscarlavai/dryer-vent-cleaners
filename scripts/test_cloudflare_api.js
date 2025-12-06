/**
 * Test Cloudflare Images API credentials
 *
 * This script tests your Cloudflare API credentials and permissions
 *
 * Usage:
 *   node scripts/test_cloudflare_api.js
 */

const FormData = require('form-data');
require('dotenv').config({ path: '.env.local' });

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_IMAGES_API_TOKEN = process.env.CLOUDFLARE_IMAGES_API_TOKEN;

async function testCredentials() {
  console.log('🔍 Testing Cloudflare Images API Credentials\n');

  // Check if credentials are set
  console.log('1. Checking environment variables...');
  if (!CLOUDFLARE_ACCOUNT_ID) {
    console.error('   ❌ CLOUDFLARE_ACCOUNT_ID is not set');
    return false;
  }
  console.log(`   ✓ CLOUDFLARE_ACCOUNT_ID: ${CLOUDFLARE_ACCOUNT_ID}`);

  if (!CLOUDFLARE_IMAGES_API_TOKEN) {
    console.error('   ❌ CLOUDFLARE_IMAGES_API_TOKEN is not set');
    return false;
  }
  console.log(`   ✓ CLOUDFLARE_IMAGES_API_TOKEN: ${CLOUDFLARE_IMAGES_API_TOKEN.substring(0, 10)}...`);

  // Test 1: List images (to verify authentication)
  console.log('\n2. Testing API authentication (listing images)...');
  try {
    const listResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v2`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_IMAGES_API_TOKEN}`,
        },
      }
    );

    const listResult = await listResponse.json();

    if (!listResponse.ok || !listResult.success) {
      console.error('   ❌ Authentication failed!');
      console.error('   Error:', listResult.errors?.[0]?.message || `HTTP ${listResponse.status}`);
      console.error('\n📋 Troubleshooting:');
      console.error('   1. Check that your API token is correct');
      console.error('   2. Verify the token has "Cloudflare Images: Edit" permission');
      console.error('   3. Make sure the token is active and not expired');
      console.error('   4. Create token at: https://dash.cloudflare.com/profile/api-tokens');
      return false;
    }

    console.log('   ✓ Authentication successful!');
    console.log(`   ℹ️  You currently have ${listResult.result.images?.length || 0} images`);

  } catch (error) {
    console.error('   ❌ Request failed:', error.message);
    return false;
  }

  // Test 2: Upload a test image
  console.log('\n3. Testing image upload (using a test image)...');
  try {
    const testImageUrl = 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400'; // Public test image

    const formData = new FormData();
    formData.append('url', testImageUrl);

    console.log('   📤 Preparing upload...');

    // Convert stream to buffer with proper handling
    const formHeaders = formData.getHeaders();
    const formBuffer = await new Promise((resolve, reject) => {
      const bufs = [];
      formData.on('data', (chunk) => {
        // Ensure chunk is a Buffer (it might be a string)
        bufs.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      formData.on('end', () => {
        resolve(Buffer.concat(bufs));
      });
      formData.on('error', reject);

      // Important: resume the stream to trigger data events
      formData.resume();
    });

    console.log('   📡 Uploading to Cloudflare...');

    const uploadResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_IMAGES_API_TOKEN}`,
          ...formHeaders,
        },
        body: formBuffer,
      }
    );

    const uploadResult = await uploadResponse.json();

    if (!uploadResponse.ok || !uploadResult.success) {
      console.error('   ❌ Upload failed!');
      console.error('   Error:', uploadResult.errors?.[0]?.message || `HTTP ${uploadResponse.status}`);
      console.error('\n📋 Possible issues:');
      console.error('   1. Your API token may not have upload permissions');
      console.error('   2. You may have reached your Cloudflare Images storage limit');
      console.error('   3. The test image URL may be blocked');
      return false;
    }

    console.log('   ✓ Upload successful!');
    console.log(`   ℹ️  Test image ID: ${uploadResult.result.id}`);
    console.log(`   ℹ️  URL: https://imagedelivery.net/${process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_ACCOUNT_HASH}/${uploadResult.result.id}/public`);

    // Clean up: Delete the test image
    console.log('\n4. Cleaning up test image...');
    const deleteResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1/${uploadResult.result.id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_IMAGES_API_TOKEN}`,
        },
      }
    );

    if (deleteResponse.ok) {
      console.log('   ✓ Test image deleted');
    } else {
      console.log('   ⚠️  Could not delete test image (you may need to delete it manually)');
    }

  } catch (error) {
    console.error('   ❌ Upload test failed:', error.message);
    return false;
  }

  console.log('\n✅ All tests passed! Your Cloudflare API credentials are working correctly.\n');
  return true;
}

// Run the test
if (require.main === module) {
  testCredentials()
    .then(success => {
      if (success) {
        console.log('You can now run the migration script:');
        console.log('  node scripts/migrate_to_cloudflare_images.js --limit 2');
        process.exit(0);
      } else {
        console.log('\n❌ Please fix the issues above before running the migration.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}
