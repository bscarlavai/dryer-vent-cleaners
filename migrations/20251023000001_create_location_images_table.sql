-- Migration: Create location_images table for Cloudflare Images integration
-- Created: 2025-10-23
-- Description: Adds support for storing Cloudflare Images references with support for future user uploads

-- ============================================================================
-- UP MIGRATION
-- ============================================================================

-- Create location_images table
CREATE TABLE IF NOT EXISTS location_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,

  -- Cloudflare Images reference (just the image ID, not the full URL)
  -- This allows flexibility if account hash changes or we add custom domains
  cf_image_id TEXT NOT NULL,

  -- Image classification
  -- 'photo' = main location photo (replaces photo_url)
  -- 'logo' = business logo (replaces logo_url)
  -- 'street_view' = street view image (replaces street_view_url)
  -- 'gallery' = additional user-uploaded images
  image_type TEXT NOT NULL CHECK (image_type IN ('photo', 'logo', 'street_view', 'gallery')),

  -- Ordering and selection
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,

  -- Future-proofing for user uploads
  -- Values: 'system' (migrated from Google), 'admin', or user_id
  uploaded_by TEXT DEFAULT 'system',

  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Store original URL for reference/debugging during migration
  -- Can be removed after migration is complete and verified
  source_url TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_location_images_location_id
  ON location_images(location_id);

CREATE INDEX IF NOT EXISTS idx_location_images_lookup
  ON location_images(location_id, image_type, is_primary)
  WHERE is_primary = true;

-- Ensure only one primary image per type per location
-- This is a partial index - only enforces uniqueness when is_primary = true
-- Allows unlimited non-primary images (user uploads)
CREATE UNIQUE INDEX IF NOT EXISTS idx_location_images_primary_unique
  ON location_images(location_id, image_type)
  WHERE is_primary = true;

-- Add comment for documentation
COMMENT ON TABLE location_images IS 'Stores Cloudflare Images references for locations. Supports both system images and future user uploads.';
COMMENT ON COLUMN location_images.cf_image_id IS 'Cloudflare Images ID (not the full URL). Use with account hash to construct delivery URL.';
COMMENT ON COLUMN location_images.is_primary IS 'Primary image shown on location pages. Only one primary per image_type per location allowed.';
COMMENT ON COLUMN location_images.uploaded_by IS 'Source of upload: system (migration), admin, or user_id for future user uploads.';
COMMENT ON COLUMN location_images.source_url IS 'Original URL before migration. For debugging/reference only.';

-- ============================================================================
-- DOWN MIGRATION (Rollback)
-- ============================================================================
-- Uncomment and run these commands to rollback this migration:
--
-- DROP INDEX IF EXISTS idx_location_images_primary_unique;
-- DROP INDEX IF EXISTS idx_location_images_lookup;
-- DROP INDEX IF EXISTS idx_location_images_location_id;
-- DROP TABLE IF EXISTS location_images;
