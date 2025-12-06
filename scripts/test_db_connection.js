const { exec } = require('child_process');
const { promisify } = require('util');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const execAsync = promisify(exec);

async function testPostgresConnection() {
  console.log('Testing PostgreSQL Direct Connection...\n');

  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('❌ DATABASE_URL not found in .env.local');
    console.log('\nTo get your database URL:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Go to Settings > Database');
    console.log('3. Copy the "Direct connection" string');
    console.log('4. Add it to your .env.local file as DATABASE_URL');
    return false;
  }

  console.log('✓ DATABASE_URL found');

  try {
    // Parse the database URL to handle special characters in password
    const url = new URL(dbUrl);
    const password = decodeURIComponent(url.password);
    const encodedPassword = encodeURIComponent(password);
    url.password = encodedPassword;
    const encodedDbUrl = url.toString();

    // Test connection with a simple query
    const testQuery = `SELECT 1 as test`;
    const command = `psql "${encodedDbUrl}" -c "${testQuery}"`;

    console.log('Testing connection with simple query...');
    const { stdout } = await execAsync(command);

    if (stdout.includes('1 row')) {
      console.log('✓ PostgreSQL connection successful!\n');
      return true;
    } else {
      console.error('❌ Unexpected response from database\n');
      return false;
    }
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:');
    console.error(error.message);
    console.log('\nCommon issues:');
    console.log('- Make sure psql is installed (brew install postgresql)');
    console.log('- Check that your password is correct');
    console.log('- Verify the database URL format');
    console.log('- Ensure your IP is allowed in Supabase (Settings > Database > Connection Pooling)');
    return false;
  }
}

async function testSupabaseClient() {
  console.log('Testing Supabase Client Connection...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
    return false;
  }

  if (!supabaseKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local');
    return false;
  }

  console.log('✓ Supabase credentials found');

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test with a simple query
    console.log('Testing Supabase client with query...');
    const { data, error } = await supabase
      .from('locations')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Supabase query failed:');
      console.error(error.message);
      return false;
    }

    console.log('✓ Supabase client connection successful!');
    console.log(`✓ Found ${data ? data.length : 0} location(s) in database\n`);
    return true;
  } catch (error) {
    console.error('❌ Supabase client connection failed:');
    console.error(error.message);
    return false;
  }
}

async function testConnections() {
  console.log('='.repeat(60));
  console.log('Database Connection Test');
  console.log('='.repeat(60) + '\n');

  const postgresOk = await testPostgresConnection();
  const supabaseOk = await testSupabaseClient();

  console.log('='.repeat(60));
  console.log('Summary:');
  console.log('='.repeat(60));
  console.log(`PostgreSQL (Direct): ${postgresOk ? '✓ Connected' : '❌ Failed'}`);
  console.log(`Supabase Client:     ${supabaseOk ? '✓ Connected' : '❌ Failed'}`);
  console.log('='.repeat(60) + '\n');

  if (postgresOk && supabaseOk) {
    console.log('✓ All connections successful! You\'re ready to import data.\n');
    process.exit(0);
  } else {
    console.log('❌ Some connections failed. Please check the errors above.\n');
    process.exit(1);
  }
}

testConnections();
