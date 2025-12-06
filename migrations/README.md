# Database Migrations

This directory contains SQL migration files for the Self Car Wash Finder database.

## Generating Initial Migration from Existing Database

If you're starting migrations on an existing database, you should first capture the current schema:

```bash
# Node.js version (recommended - cleaner output)
node scripts/generate_initial_migration.js > migrations/00000000000000_initial_schema.sql

# Or SQL version (if you prefer pure SQL)
psql "$DATABASE_URL" -f scripts/generate_initial_migration.sql > migrations/00000000000000_initial_schema.sql
```

This will create a complete snapshot of your current database including:
- All tables with columns, constraints, and defaults
- Foreign key relationships
- Indexes
- Views
- Functions and procedures
- Triggers
- Row Level Security (RLS) policies
- Comments

**Note:** You only need to do this once when you first set up migrations. After that, all changes should be made through new migration files.

## Migration Naming Convention

Migrations are named using the following format:
```
YYYYMMDDHHMMSS_description.sql
```

Example: `20251023000001_create_location_images_table.sql`

The timestamp ensures migrations run in the correct order.

## Running Migrations

### Option 1: Via psql Command Line (Recommended)

1. Ensure you have the `DATABASE_URL` environment variable set in your `.env.local` file:
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

2. Run a specific migration:
   ```bash
   psql "$DATABASE_URL" -f migrations/20251023000001_create_location_images_table.sql
   ```

3. To run all pending migrations in order:
   ```bash
   for file in migrations/*.sql; do
     echo "Running migration: $file"
     psql "$DATABASE_URL" -f "$file"
   done
   ```

### Option 2: Via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor"
3. Copy and paste the migration SQL
4. Click "Run"

### Option 3: Via Node.js Script

You can also run migrations programmatically:

```javascript
const { exec } = require('child_process');
const { promisify } = require('util');
require('dotenv').config({ path: '.env.local' });

const execAsync = promisify(exec);

async function runMigration(filename) {
  const dbUrl = process.env.DATABASE_URL;
  await execAsync(`psql "${dbUrl}" -f migrations/${filename}`);
  console.log(`✓ Migration ${filename} completed`);
}

runMigration('20251023000001_create_location_images_table.sql');
```

## Rollback Migrations

Each migration file includes commented rollback SQL at the bottom. To rollback:

1. Locate the "DOWN MIGRATION" section in the migration file
2. Copy the rollback SQL commands
3. Run them via psql or Supabase dashboard

Example:
```bash
psql "$DATABASE_URL" -c "DROP TABLE IF EXISTS location_images;"
```

## Current Migrations

| Timestamp | Description | Status |
|-----------|-------------|--------|
| 20251023000001 | Create location_images table for Cloudflare Images | Pending |

## Best Practices

1. **Never modify existing migrations** - Create a new migration to make changes
2. **Test migrations locally first** - Use a development database before running on production
3. **Backup before running** - Always have a recent database backup
4. **Run migrations in order** - The timestamp ensures proper sequencing
5. **Document breaking changes** - Add comments for any changes that require code updates

## Getting Your Database URL

To get your Supabase database connection URL:

1. Go to your Supabase project dashboard
2. Navigate to Settings > Database
3. Copy the "Connection string" under "Direct connection"
4. Add it to your `.env.local` file as `DATABASE_URL`

**Note:** Use the **direct connection** string, not the pooling connection string, for running migrations.
