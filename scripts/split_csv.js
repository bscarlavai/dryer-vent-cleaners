const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config({ path: '.env.local' });
const slugify = require('../lib/slugify');

// Helper function to parse working hours JSON
function parseWorkingHours(hoursJson) {
  if (!hoursJson || hoursJson === '{}') return null;
  try {
    return JSON.parse(hoursJson);
  } catch (error) {
    console.warn('Failed to parse working hours:', hoursJson);
    return null;
  }
}

// Helper function to extract amenities from the 'about' field
function extractAmenities(aboutJson) {
  if (!aboutJson || aboutJson === '{}') return [];
  
  try {
    const about = JSON.parse(aboutJson);
    const amenities = [];
    
    // Extract amenities from all categories dynamically
    Object.keys(about).forEach(category => {
      const categoryObj = about[category];
      if (categoryObj && typeof categoryObj === 'object') {
        Object.keys(categoryObj).forEach(amenity => {
          if (categoryObj[amenity] === true) {
            amenities.push({
              name: amenity,
              category: category
            });
          }
        });
      }
    });
    
    return amenities;
  } catch (error) {
    console.warn('Failed to parse amenities:', aboutJson);
    return [];
  }
}

// Helper function to parse hours into normalized format
function parseHours(hoursJson) {
  if (!hoursJson || hoursJson === '{}') return [];
  
  try {
    const hours = JSON.parse(hoursJson);
    const normalizedHours = [];
    
    const dayMap = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
      'Sunday': 7
    };
    
    Object.keys(hours).forEach(day => {
      const dayNumber = dayMap[day];
      if (dayNumber && hours[day]) {
        const timeString = hours[day];
        
        if (timeString.toLowerCase() === 'closed') {
          normalizedHours.push({
            day_of_week: dayNumber,
            is_closed: true
          });
        } else if (timeString.toLowerCase() === 'open 24 hours') {
          // Handle 24-hour format
          normalizedHours.push({
            day_of_week: dayNumber,
            open_time: '12:00 AM',
            close_time: '11:59 PM',
            is_closed: false
          });
        } else {
          // Parse time ranges like "10AM-6PM" or "11:20AM-3:20PM,4-8:40PM"
          const timeRanges = timeString.split(',').map(range => range.trim());
          
          timeRanges.forEach(range => {
            let [open, close] = range.split('-').map(t => t.trim());

            // If close has AM/PM and open does not, infer period from close
            const closeMatch = close.match(/(AM|PM)$/i);
            const openMatch = open.match(/(AM|PM)$/i);
            if (closeMatch && !openMatch) {
              open = open + closeMatch[0].toUpperCase();
            }
            // If open has AM/PM and close does not, infer period from open
            if (openMatch && !closeMatch) {
              close = close + openMatch[0].toUpperCase();
            }
            // Now convert
            const openTime = convertTo12Hour(open);
            const closeTime = convertTo12Hour(close);
            
            if (openTime && closeTime) {
              normalizedHours.push({
                day_of_week: dayNumber,
                open_time: openTime,
                close_time: closeTime,
                is_closed: false
              });
            }
          });
        }
      }
    });
    
    return normalizedHours;
  } catch (error) {
    console.warn('Failed to parse hours:', hoursJson);
    return [];
  }
}

// Helper function to convert time to 12-hour format
function convertTo12Hour(timeStr) {
  if (!timeStr) return null;
  
  // Remove any extra spaces and convert to uppercase
  timeStr = timeStr.trim().toUpperCase();
  
  // Handle formats like "10AM", "6PM", "11:20AM", "8:40PM"
  let match = timeStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (match) {
    const hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const period = match[3];
    
    // Keep in 12-hour format: "10:30 AM" or "6:00 PM"
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  }
  
  // Handle formats like "10", "6", "11:20", "8:40" (without AM/PM)
  match = timeStr.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    
    // Assume AM for 1-11, PM for 12-23
    let period = 'AM';
    if (hours >= 12) {
      period = 'PM';
      if (hours > 12) {
        hours -= 12;
      }
    } else if (hours === 0) {
      hours = 12;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  }
  
  return null;
}

// Helper to convert time to 24-hour HH:MM:SS format
function to24Hour(timeStr) {
  if (!timeStr) return '';
  // Handle already 24-hour format
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
    return timeStr.length === 5 ? timeStr + ':00' : timeStr;
  }
  // Handle 12-hour format like 10:00 AM
  const match = timeStr.match(/(\d{1,2}):(\d{2}) ?([AP]M)/i);
  if (!match) return '';
  let [_, h, m, ampm] = match;
  h = parseInt(h, 10);
  if (/PM/i.test(ampm) && h !== 12) h += 12;
  if (/AM/i.test(ampm) && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${m}:00`;
}

// Helper to always quote every field
function quoteAll(field) {
  return '"' + String(field || '').replace(/\n/g, ' ').replace(/\r/g, '').replace(/"/g, '""') + '"';
}

async function splitCsv() {
  console.log('Starting CSV split process...\n');
  
  // Create output directory
  const outputDir = './split_csv';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  // Prepare data arrays
  const locations = [];
  const amenities = [];
  const hours = [];
  
  console.log('Reading and processing CSV file...');
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('sample_data.csv')
      .pipe(csv())
      .on('data', (row) => {
        // Skip rows without a proper name or google_place_id
        if (!row.name || row.name === 'None' || !row.place_id) return;
        
        const locationId = crypto.randomUUID();
        const slug = slugify(row.name);
        
        // Prepare location data
        const location = {
          id: locationId,
          name: row.name,
          slug: slug,
          city_slug: slugify(row.city),
          website_url: row.site || null,
          phone: row.phone || null,
          email: null,
          street_address: row.full_address || null,
          city: row.city || null,
          state: row.state || null,
          postal_code: row.postal_code ? row.postal_code.substring(0, 10) : null,
          country: row.country || 'United States',
          latitude: row.latitude ? parseFloat(row.latitude) : null,
          longitude: row.longitude ? parseFloat(row.longitude) : null,
          description: row.description || null,
          business_type: row.type || null,
          business_status: row.business_status || null,
          google_rating: row.rating ? parseFloat(row.rating) : null,
          review_count: row.reviews ? parseInt(row.reviews) : null,
          reviews_tags: row.reviews_tags ? `{${row.reviews_tags}}` : null,
          working_hours: parseWorkingHours(row.working_hours),
          price_level: row.range || null,
          photo_url: row.photo || null,
          logo_url: row.logo || null,
          street_view_url: row.street_view || null,
          reservation_urls: row.reservation_links ? `{${row.reservation_links}}` : null,
          booking_appointment_url: row.booking_appointment_link || null,
          menu_url: row.menu_link || null,
          order_urls: row.order_links ? `{${row.order_links}}` : null,
          location_url: row.location_link || null,
          google_place_id: row.place_id,
          google_id: row.google_id || null,
          google_verified: row.verified === 'TRUE',
          updated_at: new Date().toISOString()
        };
        
        locations.push(location);
        
        // Extract and prepare amenities
        const locationAmenities = extractAmenities(row.about);
        locationAmenities.forEach(amenity => {
          amenities.push({
            location_id: locationId,
            amenity_name: amenity.name,
            amenity_category: amenity.category
          });
        });
        
        // Parse and prepare hours
        const locationHours = parseHours(row.working_hours);
        locationHours.forEach(hour => {
          hours.push({
            location_id: locationId,
            ...hour
          });
        });
      })
      .on('end', async () => {
        console.log(`Processed ${locations.length} locations`);
        console.log(`Found ${amenities.length} amenities`);
        console.log(`Found ${hours.length} hour entries`);
        
        try {
          // Stringify working_hours for each location
          locations.forEach(location => {
            // Set working_hours to empty string since we store hours in location_hours table
            location.working_hours = '';
            // Ensure updated_at is always present
            if (!location.updated_at) {
              location.updated_at = new Date().toISOString();
            }
            // Ensure all fields are strings (not null/undefined)
            Object.keys(location).forEach(key => {
              if (location[key] === null || location[key] === undefined) {
                location[key] = '';
              }
            });
          });

          // Write locations CSV manually, always quoting every field
          const locationsCsv = [
            // Header
            ['id', 'name', 'slug', 'city_slug', 'website_url', 'phone', 'email', 'street_address', 'city', 'state', 'postal_code', 'country', 'latitude', 'longitude', 'description', 'business_type', 'business_status', 'google_rating',
              'review_count', 'reviews_tags', 'working_hours', 'price_level', 'photo_url', 'logo_url', 'street_view_url', 'reservation_urls', 'booking_appointment_url', 'menu_url', 'order_urls', 'location_url',
              'google_place_id', 'google_id', 'google_verified', 'updated_at'],
            // Data rows
            ...locations.map(location => [
              location.id,
              location.name,
              location.slug,
              location.city_slug,
              location.website_url,
              location.phone,
              location.email,
              location.street_address,
              location.city,
              location.state,
              location.postal_code,
              location.country,
              location.latitude,
              location.longitude,
              location.description,
              location.business_type,
              location.business_status,
              location.google_rating,
              location.review_count,
              location.reviews_tags,
              location.working_hours,
              location.price_level,
              location.photo_url,
              location.logo_url,
              location.street_view_url,
              location.reservation_urls,
              location.booking_appointment_url,
              location.menu_url,
              location.order_urls,
              location.location_url,
              location.google_place_id,
              location.google_id,
              location.google_verified,
              location.updated_at
            ])
          ];
          
          fs.writeFileSync(`${outputDir}/locations.csv`, locationsCsv.map(row => row.map(quoteAll).join(',')).join('\n'));

          // Write amenities CSV manually, always quoting every field
          const amenitiesCsv = [
            ['location_id', 'amenity_name', 'amenity_category'],
            ...amenities.map(amenity => [
              amenity.location_id,
              amenity.amenity_name,
              amenity.amenity_category
            ])
          ];
          
          fs.writeFileSync(`${outputDir}/location_amenities.csv`, amenitiesCsv.map(row => row.map(quoteAll).join(',')).join('\n'));

          // Write hours CSV manually, only quote non-boolean fields
          const hoursCsv = [
            ['location_id', 'day_of_week', 'open_time', 'close_time', 'is_closed'],
            ...hours.map(hour => [
              quoteAll(hour.location_id),
              quoteAll(hour.day_of_week),
              quoteAll(hour.open_time),
              quoteAll(hour.close_time),
              (hour.is_closed === 'true' || hour.is_closed === true) ? 'true' : (hour.is_closed === 'false' || hour.is_closed === false ? 'false' : '') // boolean, no quotes
            ])
          ];
          
          fs.writeFileSync(`${outputDir}/location_hours.csv`, hoursCsv.map(row => row.join(',')).join('\n'));

          console.log('CSV files written successfully!');
          console.log('\nFiles created in ./split_csv/:');
          console.log('- locations.csv');
          console.log('- location_amenities.csv');
          console.log('- location_hours.csv');
          console.log('\nCSV split completed!');
          resolve();
        } catch (error) {
          console.error('Failed to write CSV files:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('Error reading CSV:', error);
        reject(error);
      });
  });
}

// Run the split
if (require.main === module) {
  splitCsv()
    .then(() => {
      console.log('\nCSV split completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('CSV split failed:', error);
      process.exit(1);
    });
}

module.exports = { splitCsv }; 