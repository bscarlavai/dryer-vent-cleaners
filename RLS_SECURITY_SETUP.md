# Supabase Row Level Security (RLS) Setup

## Overview
This document contains instructions for securing the Supabase database with Row Level Security policies.

**Status:** Not yet implemented - IMPORTANT SECURITY TASK

## Current Issue
The database may be vulnerable to unauthorized access because RLS is not properly configured. Anyone with the public anon key could potentially read/write/delete data.

## Step 1: Check Current RLS Status

Run this in Supabase SQL Editor:

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('locations', 'location_amenities', 'location_hours', 'location_claims', 'location_feedback', 'location_images');
```

Look for any tables where `rowsecurity = false`.

## Step 2: Enable RLS on All Tables

```sql
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_images ENABLE ROW LEVEL SECURITY;
```

## Step 3: Create RLS Policies

### Locations Table
```sql
-- Public can read approved locations only
CREATE POLICY "Public read approved locations"
ON locations FOR SELECT
USING (review_status = 'approved' AND business_status IN ('OPERATIONAL', 'CLOSED_TEMPORARILY'));

-- Prevent all public writes
CREATE POLICY "Prevent public insert"
ON locations FOR INSERT
WITH CHECK (false);

CREATE POLICY "Prevent public update"
ON locations FOR UPDATE
USING (false);

CREATE POLICY "Prevent public delete"
ON locations FOR DELETE
USING (false);
```

### Location Amenities Table
```sql
-- Public can read amenities for approved locations only
CREATE POLICY "Public read amenities"
ON location_amenities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM locations
    WHERE locations.id = location_amenities.location_id
    AND review_status = 'approved'
  )
);

CREATE POLICY "Prevent public write amenities"
ON location_amenities FOR ALL
USING (false);
```

### Location Hours Table
```sql
-- Public can read hours for approved locations only
CREATE POLICY "Public read hours"
ON location_hours FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM locations
    WHERE locations.id = location_hours.location_id
    AND review_status = 'approved'
  )
);

CREATE POLICY "Prevent public write hours"
ON location_hours FOR ALL
USING (false);
```

### Location Images Table
```sql
-- Public can read images for approved locations only
CREATE POLICY "Public read images"
ON location_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM locations
    WHERE locations.id = location_images.location_id
    AND review_status = 'approved'
  )
);

CREATE POLICY "Prevent public write images"
ON location_images FOR ALL
USING (false);
```

### Location Claims Table
```sql
-- Public can submit claims but not read others' claims
CREATE POLICY "Public can insert claims"
ON location_claims FOR INSERT
WITH CHECK (true);

CREATE POLICY "Prevent public read claims"
ON location_claims FOR SELECT
USING (false);
```

### Location Feedback Table
```sql
-- Public can submit feedback but not read others' feedback
CREATE POLICY "Public can insert feedback"
ON location_feedback FOR INSERT
WITH CHECK (true);

CREATE POLICY "Prevent public read feedback"
ON location_feedback FOR SELECT
USING (false);
```

## Step 4: Admin Access

For admin pages (/admin/*), choose one approach:

### Option A: Use Service Role Key (server-side only)
1. Add `SUPABASE_SERVICE_ROLE_KEY` to Cloudflare Worker runtime secrets (NOT build variables)
2. Use this key only in server-side API routes for admin operations
3. **NEVER expose this key to the client**

### Option B: Set up Supabase Auth (more secure, recommended)
1. Add authentication to admin pages
2. Create policies that check `auth.uid()` for admin users
3. Store admin user IDs in an `admin_users` table
4. Update policies to allow authenticated admins to perform operations

## Testing

After implementing RLS policies:

1. Test public read access works for approved locations
2. Test that unapproved locations are hidden
3. Test that write operations are blocked from the client
4. Test that admin operations still work (after implementing admin auth)

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

## Related Cloudflare Environment Variable Issue

Also need to fix Cloudflare build environment variables for git deployments:

1. Go to Cloudflare Workers & Pages → self-car-wash-finder → Settings
2. Add build environment variables (NOT runtime secrets):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Remove unused runtime secrets:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
