const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
require('dotenv').config({ path: '.env.local' });

const execAsync = promisify(exec);

async function psqlImport() {
  console.log('Starting PostgreSQL import using COPY commands...\n');
  
  // You need to get these from your Supabase dashboard:
  // 1. Go to your Supabase project dashboard
  // 2. Go to Settings > Database
  // 3. Find "Connection string" or "Connection pooling"
  // 4. Use the "Direct connection" string (not the pooling one)
  
  // Example format:
  // postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
  
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('Missing DATABASE_URL environment variable');
    console.log('\nTo get your database URL:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Go to Settings > Database');
    console.log('3. Copy the "Direct connection" string');
    console.log('4. Add it to your .env.local file as DATABASE_URL');
    console.log('\nExample:');
    console.log('DATABASE_URL=postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres');
    process.exit(1);
  }
  
  try {
    // Check if CSV files exist
    const csvDir = './split_csv';
    if (!fs.existsSync(csvDir)) {
      console.error('CSV files not found. Please run the split script first:');
      console.log('node scripts/split_csv.js');
      process.exit(1);
    }
    
    // Parse the database URL to handle special characters in password
    const url = new URL(dbUrl);
    const password = decodeURIComponent(url.password);
    const encodedPassword = encodeURIComponent(password);
    url.password = encodedPassword;
    const encodedDbUrl = url.toString();
    
    // Import locations
    console.log('Importing locations...');
    await execAsync(
      `psql "${encodedDbUrl}" -c "DROP TABLE IF EXISTS locations_staging;"`
    );
    await execAsync(
      `psql "${encodedDbUrl}" -c "CREATE TABLE locations_staging (LIKE locations INCLUDING DEFAULTS EXCLUDING CONSTRAINTS);"`
    );
    await execAsync(`psql "${encodedDbUrl}" -c "\\COPY locations_staging (
        id, name, slug, city_slug, website_url, phone, email, street_address, city, state, postal_code, country,
        latitude, longitude, description, business_type, business_status, google_rating, review_count, reviews_tags,
        working_hours, price_level, photo_url, logo_url, street_view_url, reservation_urls, booking_appointment_url,
        menu_url, order_urls, location_url, google_place_id, google_id, google_verified, updated_at
      )
      FROM '${csvDir}/locations.csv'
      WITH (FORMAT csv, HEADER true, FORCE_NULL (
        email, website_url, phone, street_address, city, state, postal_code, country,
        latitude, longitude, description, business_type, business_status, google_rating, google_verified,
        review_count, working_hours, price_level, photo_url, logo_url, street_view_url, google_id, updated_at, reviews_tags, reservation_urls, order_urls
      ))"`);
      // Update slugs to be unique for new locations that would conflict with existing data, but not for true duplicates
    await execAsync(`psql "${encodedDbUrl}" -c "UPDATE locations_staging ls
      SET slug = ls.slug || '-' || substr(md5(ls.google_place_id), 1, 8)
      FROM locations l
      WHERE
        ls.slug = l.slug
        AND ls.state = l.state
        AND ls.city = l.city
        AND ls.google_place_id <> l.google_place_id;"`);
    
    await execAsync(`psql "${encodedDbUrl}" -c "INSERT INTO locations (
        id, name, slug, city_slug, website_url, phone, email, street_address, city, state, postal_code, country,
        latitude, longitude, description, business_type, business_status, google_rating, review_count, reviews_tags,
        working_hours, price_level, photo_url, logo_url, street_view_url, google_place_id, google_id, google_verified, updated_at,
        reservation_urls, booking_appointment_url, menu_url, order_urls, location_url
      )
      SELECT 
        id, name, slug, city_slug, website_url, phone, email, street_address, city, state, postal_code, country,
        latitude, longitude, description, business_type, business_status, google_rating, review_count, reviews_tags,
        working_hours, price_level, photo_url, logo_url, street_view_url, google_place_id, google_id, google_verified, updated_at,
        reservation_urls, booking_appointment_url, menu_url, order_urls, location_url
      FROM locations_staging
      WHERE NOT EXISTS (SELECT 1 FROM locations WHERE locations.google_place_id = locations_staging.google_place_id)
      ON CONFLICT (slug, state, city) DO NOTHING;"`);
    await execAsync(`psql "${encodedDbUrl}" -c "UPDATE locations SET
      slug = locations_staging.slug, city_slug = locations_staging.city_slug, website_url = locations_staging.website_url, phone = locations_staging.phone, email = locations_staging.email,
      google_verified = locations_staging.google_verified, business_status = locations_staging.business_status,
      description = locations_staging.description, google_rating = locations_staging.google_rating, review_count = locations_staging.review_count,
      reviews_tags = locations_staging.reviews_tags,
      working_hours = locations_staging.working_hours, price_level = locations_staging.price_level, photo_url = locations_staging.photo_url,
      logo_url = locations_staging.logo_url, street_view_url = locations_staging.street_view_url, google_id = locations_staging.google_id,
      updated_at = locations_staging.updated_at,
      reservation_urls = locations_staging.reservation_urls,
      booking_appointment_url = locations_staging.booking_appointment_url,
      menu_url = locations_staging.menu_url,
      order_urls = locations_staging.order_urls,
      location_url = locations_staging.location_url
      FROM locations_staging
      WHERE locations.google_place_id = locations_staging.google_place_id;"`);
    await execAsync(`psql "${encodedDbUrl}" -c "DROP TABLE locations_staging;"`);
    
    // Import amenities
    console.log('Importing amenities...');
    await execAsync(
      `psql "${encodedDbUrl}" -c "DROP TABLE IF EXISTS location_amenities_staging;"`
    );
    await execAsync(
      `psql "${encodedDbUrl}" -c "CREATE TABLE location_amenities_staging (LIKE location_amenities INCLUDING DEFAULTS EXCLUDING CONSTRAINTS);"`
    );
    await execAsync(
      `psql "${encodedDbUrl}" -c "\\COPY location_amenities_staging (location_id, amenity_name, amenity_category) FROM '${csvDir}/location_amenities.csv' WITH (FORMAT csv, HEADER true)"`
    );
    await execAsync(`psql "${encodedDbUrl}" -c "INSERT INTO location_amenities (location_id, amenity_name, amenity_category)
      SELECT location_id, amenity_name, amenity_category
      FROM location_amenities_staging
        JOIN locations ON locations.id = location_amenities_staging.location_id
      WHERE NOT EXISTS (SELECT 1 FROM location_amenities WHERE location_amenities.location_id = location_amenities_staging.location_id AND location_amenities.amenity_name = location_amenities_staging.amenity_name)
      ON CONFLICT (location_id, amenity_name) DO NOTHING;"`);
    await execAsync(`psql "${encodedDbUrl}" -c "UPDATE location_amenities SET
      amenity_category = location_amenities_staging.amenity_category
      FROM location_amenities_staging
      WHERE location_amenities.location_id = location_amenities_staging.location_id AND location_amenities.amenity_name = location_amenities_staging.amenity_name;"`);
    await execAsync(`psql "${encodedDbUrl}" -c "DROP TABLE location_amenities_staging;"`);
    
    // Import hours
    console.log('Importing hours...');
    await execAsync(
      `psql "${encodedDbUrl}" -c "DROP TABLE IF EXISTS location_hours_staging;"`
    );
    await execAsync(
      `psql "${encodedDbUrl}" -c "CREATE TABLE location_hours_staging (LIKE location_hours INCLUDING DEFAULTS EXCLUDING CONSTRAINTS);"`
    );
    await execAsync(
      `psql "${encodedDbUrl}" -c "\\COPY location_hours_staging (location_id, day_of_week, open_time, close_time, is_closed) FROM '${csvDir}/location_hours.csv' WITH (FORMAT csv, HEADER true)"`
    );
    await execAsync(`psql "${encodedDbUrl}" -c "INSERT INTO location_hours (location_id, day_of_week, open_time, close_time, is_closed)
      SELECT location_hours_staging.location_id, location_hours_staging.day_of_week, location_hours_staging.open_time, location_hours_staging.close_time, location_hours_staging.is_closed
      FROM location_hours_staging
      JOIN locations ON locations.id = location_hours_staging.location_id
      WHERE NOT EXISTS (SELECT 1 FROM location_hours WHERE location_hours.location_id = location_hours_staging.location_id AND location_hours.day_of_week = location_hours_staging.day_of_week)
      ON CONFLICT (location_id, day_of_week) DO NOTHING;"`);
    await execAsync(`psql "${encodedDbUrl}" -c "UPDATE location_hours SET
      open_time = location_hours_staging.open_time, close_time = location_hours_staging.close_time, is_closed = location_hours_staging.is_closed
      FROM location_hours_staging
      WHERE location_hours.location_id = location_hours_staging.location_id AND location_hours.day_of_week = location_hours_staging.day_of_week;"`);
    await execAsync(`psql "${encodedDbUrl}" -c "DROP TABLE location_hours_staging;"`);
    

    console.log('\nImport completed successfully!');
    
  } catch (error) {
    console.error('Import failed:', error.message);
    if (error.stderr) {
      console.error('Error details:', error.stderr);
    }
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  psqlImport()
    .then(() => {
      console.log('Data import completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Data import failed:', error);
      process.exit(1);
    });
}

module.exports = { psqlImport }; 