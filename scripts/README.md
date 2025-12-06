# Data Import Process

This directory contains scripts to import location data from CSV into your Supabase database.

## Prerequisites

1. **Supabase Project Setup**: Make sure you have created the database tables using the SQL schema provided earlier
2. **Environment Variables**: You need your Supabase project URL and service role key

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Run the setup script:
```bash
chmod +x scripts/setup_env.sh
./scripts/setup_env.sh
```

Or manually create a `.env.local` file with:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Run the Import
```bash
npm run import-data
```

## What the Import Script Does

The `import_data.js` script:

1. **Reads the CSV file** (`sample_data.csv`) from the project root
2. **Processes each row** and extracts:
   - Basic location information (name, address, contact details)
   - Amenities from the `about` field
   - Working hours from the `working_hours` field
3. **Creates URL-friendly slugs** for each location name
4. **Converts time formats** from 12-hour to 24-hour format
5. **Inserts data** into three tables:
   - `locations` (main location data)
   - `location_amenities` (amenities for each location)
   - `location_hours` (working hours for each location)

## Data Mapping

| CSV Column | Database Field | Notes |
|------------|----------------|-------|
| `name` | `name` | Location name |
| `site` | `website_url` | Website URL |
| `phone` | `phone` | Phone number |
| `full_address` | `street_address` | Full street address |
| `city` | `city` | City name |
| `state` | `state` | State name |
| `postal_code` | `postal_code` | ZIP code |
| `country` | `country` | Country (defaults to "United States") |
| `latitude` | `latitude` | GPS latitude |
| `longitude` | `longitude` | GPS longitude |
| `description` | `description` | Business description |
| `type` | `business_type` | Type of business |
| `business_status` | `business_status` | Operating status |
| `rating` | `google_rating` | Google rating |
| `reviews` | `review_count` | Number of reviews |
| `working_hours` | `working_hours` | JSON format hours |
| `prices` | `price_level` | Price level indicator |
| `photo` | `photo_url` | Photo URL |
| `logo` | `logo_url` | Logo URL |
| `place_id` | `google_place_id` | Google Place ID |
| `google_id` | `google_id` | Google ID |
| `verified` | `verified` | Verification status |

## Troubleshooting

### Common Issues

1. **"SUPABASE_URL is not defined"**
   - Make sure your `.env.local` file exists and contains the correct environment variables

2. **"Permission denied" errors**
   - Make sure you're using the service role key, not the anon key

3. **"Table doesn't exist" errors**
   - Make sure you've created all the database tables using the SQL schema

4. **CSV parsing errors**
   - Check that your `sample_data.csv` file is in the project root directory
   - Ensure the CSV has the expected column headers

### Logs

The script provides detailed logging:
- Number of locations processed
- Number of amenities found
- Number of hour entries created
- Success/error messages for each insert operation

## After Import

Once the import is complete, you can:

1. **Verify the data** in your Supabase dashboard
2. **Update your Next.js app** to fetch data from Supabase instead of static data
3. **Add indexes** to improve query performance (especially on `state`, `city`, and `slug` columns) 