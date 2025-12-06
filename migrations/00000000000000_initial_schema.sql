--- create locations
create table public.locations (
  id uuid not null default gen_random_uuid (),
  name character varying(255) not null,
  slug character varying(255) not null,
  city_slug character varying(255) not null,
  website_url text null,
  phone character varying(50) null,
  email character varying(255) null,
  street_address text null,
  city character varying(100) null,
  state character varying(50) null,
  postal_code character varying(20) null,
  country character varying(50) null default 'United States'::character varying,
  latitude numeric(10, 8) null,
  longitude numeric(11, 8) null,
  description text null,
  business_type character varying(100) null,
  business_status character varying(50) null,
  google_rating numeric(2, 1) null,
  review_count integer null,
  reviews_tags text [] null,
  working_hours jsonb null,
  price_level character varying(10) null,
  photo_url text null,
  logo_url text null,
  street_view_url text null,
  reservation_urls text [] null,
  booking_appointment_url text null,
  menu_url text null,
  order_urls text [] null,
  location_url text null,
  google_place_id character varying(255) null,
  google_id character varying(255) null,
  google_verified boolean null default false,
  review_status character varying(50) not null default 'pending',
  claimed_status character varying(50) not null default 'unclaimed',
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint locations_pkey primary key (id),
  constraint locations_google_place_id_key unique (google_place_id),
  constraint locations_google_place_id_unique unique (google_place_id),
  constraint locations_slug_state_city_unique unique (slug, state, city)
) TABLESPACE pg_default;

create index IF not exists idx_locations_state_city on public.locations using btree (state, city) TABLESPACE pg_default;
create index IF not exists idx_locations_slug on public.locations using btree (slug) TABLESPACE pg_default;
create index IF not exists idx_locations_name on public.locations using gin (to_tsvector('english'::regconfig, (name)::text)) TABLESPACE pg_default;

-- create location_amenities
create table public.location_amenities (
  id uuid not null default gen_random_uuid (),
  location_id uuid not null,
  amenity_name character varying(100) not null,
  amenity_category character varying(50) null,
  created_at timestamp with time zone null default now(),
  constraint location_amenities_pkey primary key (id),
  constraint location_amenities_location_id_amenity_name unique (location_id, amenity_name),
  constraint location_amenities_location_id_fkey foreign KEY (location_id) references locations (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_location_amenities_name on public.location_amenities using btree (amenity_name) TABLESPACE pg_default;

-- create location_hours
create table public.location_hours (
  id uuid not null default gen_random_uuid (),
  location_id uuid not null,
  day_of_week integer not null,
  open_time text null,
  close_time text null,
  is_closed boolean null default false,
  created_at timestamp with time zone null default now(),
  constraint location_hours_pkey primary key (id),
  constraint location_hours_location_id_day_of_week unique (location_id, day_of_week),
  constraint location_hours_location_id_fkey foreign KEY (location_id) references locations (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.location_claims (
  id uuid not null default gen_random_uuid (),
  location_id uuid not null,
  name text not null,
  email text not null,
  created_at timestamp with time zone null default now(),
  constraint location_claims_pkey primary key (id),
  constraint location_claims_location_id unique (location_id)
) TABLESPACE pg_default;

create table public.location_feedbacks (
  id uuid not null default gen_random_uuid (),
  location_id uuid null,
  feedback text not null,
  email text null,
  status character varying(50) not null default 'pending',
  created_at timestamp with time zone null default now(),
  constraint location_feedbacks_pkey primary key (id)
) TABLESPACE pg_default;

CREATE TABLE public.location_review_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.location_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id),
  review_user_id UUID REFERENCES location_review_users(id), -- nullable if anonymous
  recommended BOOLEAN NOT NULL,
  comment TEXT,
  status character varying(50) not null default 'pending',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Ensure unique emails in review_users
ALTER TABLE public.location_review_users
ADD CONSTRAINT unique_review_user_email UNIQUE (email);

-- 2. Ensure only one review per location per user
ALTER TABLE public.location_reviews
ADD CONSTRAINT one_review_per_user_per_location UNIQUE (location_id, review_user_id);

CREATE OR REPLACE VIEW open_24_hour_locations AS
select distinct
  location_hours.location_id,
  locations.review_status
from
  locations
  left join location_hours on location_hours.location_id = locations.id
where
  location_hours.id is null
  or (
    location_hours.is_closed = false
    and location_hours.open_time = '12:00 AM'::text
    and (
      location_hours.close_time = any (array['11:59 PM'::text, '12:00 AM'::text])
    ));


create or replace view states_with_location_counts as
select state, count(*) as location_count
from locations
where business_status in ('OPERATIONAL', 'CLOSED_TEMPORARILY')
  and review_status = 'approved'
group by state
order by state;

CREATE OR REPLACE FUNCTION locations_within_radius(
  search_lat DOUBLE PRECISION,
  search_lng DOUBLE PRECISION,
  radius_miles DOUBLE PRECISION DEFAULT 25,
  exclude_ids UUID[] DEFAULT '{}'
)
RETURNS TABLE(
  id UUID,
  name CHARACTER VARYING(255),
  slug CHARACTER VARYING(255),
  city_slug CHARACTER VARYING(255),
  website_url TEXT,
  phone CHARACTER VARYING(50),
  email CHARACTER VARYING(255),
  street_address TEXT,
  city CHARACTER VARYING(100),
  state CHARACTER VARYING(50),
  postal_code CHARACTER VARYING(20),
  country CHARACTER VARYING(50),
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  description TEXT,
  business_type CHARACTER VARYING(100),
  business_status CHARACTER VARYING(50),
  google_rating NUMERIC(2, 1),
  review_count INTEGER,
  reviews_tags TEXT[],
  working_hours JSONB,
  price_level CHARACTER VARYING(10),
  photo_url TEXT,
  logo_url TEXT,
  street_view_url TEXT,
  reservation_urls TEXT[],
  booking_appointment_url TEXT,
  menu_url TEXT,
  order_urls TEXT[],
  location_url TEXT,
  google_place_id CHARACTER VARYING(255),
  google_id CHARACTER VARYING(255),
  google_verified BOOLEAN,
  review_status CHARACTER VARYING(50),
  claimed_status CHARACTER VARYING(50),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  distance_miles DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.name,
    l.slug,
    l.city_slug,
    l.website_url,
    l.phone,
    l.email,
    l.street_address,
    l.city,
    l.state,
    l.postal_code,
    l.country,
    l.latitude,
    l.longitude,
    l.description,
    l.business_type,
    l.business_status,
    l.google_rating,
    l.review_count,
    l.reviews_tags,
    l.working_hours,
    l.price_level,
    l.photo_url,
    l.logo_url,
    l.street_view_url,
    l.reservation_urls,
    l.booking_appointment_url,
    l.menu_url,
    l.order_urls,
    l.location_url,
    l.google_place_id,
    l.google_id,
    l.google_verified,
    l.review_status,
    l.claimed_status,
    l.created_at,
    l.updated_at,
    earth_distance(
      ll_to_earth(search_lat, search_lng),
      ll_to_earth(l.latitude, l.longitude)
    ) / 1609.34 as distance_miles
  FROM locations l
  WHERE l.review_status = 'approved'
    AND l.business_status IN ('OPERATIONAL', 'CLOSED_TEMPORARILY')
    AND l.latitude IS NOT NULL 
    AND l.longitude IS NOT NULL
    AND earth_distance(
      ll_to_earth(search_lat, search_lng),
      ll_to_earth(l.latitude, l.longitude)
    ) <= (radius_miles * 1609.34)
    AND (exclude_ids IS NULL OR array_length(exclude_ids, 1) IS NULL OR l.id != ALL(exclude_ids))
  ORDER BY distance_miles ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get popular states with location counts
CREATE OR REPLACE FUNCTION get_popular_states(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  state CHARACTER VARYING(50),
  location_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.state,
    COUNT(*) as location_count
  FROM locations l
  WHERE l.review_status = 'approved'
    AND l.business_status IN ('OPERATIONAL', 'CLOSED_TEMPORARILY')
    AND l.state IS NOT NULL
  GROUP BY l.state
  ORDER BY location_count DESC, l.state ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get popular cities with location counts
CREATE OR REPLACE FUNCTION get_popular_cities(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  city CHARACTER VARYING(100),
  state CHARACTER VARYING(50),
  location_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.city,
    l.state,
    COUNT(*) as location_count
  FROM locations l
  WHERE l.review_status = 'approved'
    AND l.business_status IN ('OPERATIONAL', 'CLOSED_TEMPORARILY')
    AND l.city IS NOT NULL
    AND l.state IS NOT NULL
  GROUP BY l.city, l.state
  ORDER BY location_count DESC, l.city ASC, l.state ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get featured locations with weighted scoring
CREATE OR REPLACE FUNCTION get_featured_locations(limit_count INTEGER DEFAULT 6)
RETURNS TABLE(
  id UUID,
  name CHARACTER VARYING(255),
  slug CHARACTER VARYING(255),
  city_slug CHARACTER VARYING(255),
  website_url TEXT,
  phone CHARACTER VARYING(50),
  email CHARACTER VARYING(255),
  street_address TEXT,
  city CHARACTER VARYING(100),
  state CHARACTER VARYING(50),
  postal_code CHARACTER VARYING(20),
  country CHARACTER VARYING(50),
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  description TEXT,
  business_type CHARACTER VARYING(100),
  business_status CHARACTER VARYING(50),
  google_rating NUMERIC(2, 1),
  review_count INTEGER,
  reviews_tags TEXT[],
  working_hours JSONB,
  price_level CHARACTER VARYING(10),
  photo_url TEXT,
  logo_url TEXT,
  street_view_url TEXT,
  reservation_urls TEXT[],
  booking_appointment_url TEXT,
  menu_url TEXT,
  order_urls TEXT[],
  location_url TEXT,
  google_place_id CHARACTER VARYING(255),
  google_id CHARACTER VARYING(255),
  google_verified BOOLEAN,
  review_status CHARACTER VARYING(50),
  claimed_status CHARACTER VARYING(50),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.name,
    l.slug,
    l.city_slug,
    l.website_url,
    l.phone,
    l.email,
    l.street_address,
    l.city,
    l.state,
    l.postal_code,
    l.country,
    l.latitude,
    l.longitude,
    l.description,
    l.business_type,
    l.business_status,
    l.google_rating,
    l.review_count,
    l.reviews_tags,
    l.working_hours,
    l.price_level,
    l.photo_url,
    l.logo_url,
    l.street_view_url,
    l.reservation_urls,
    l.booking_appointment_url,
    l.menu_url,
    l.order_urls,
    l.location_url,
    l.google_place_id,
    l.google_id,
    l.google_verified,
    l.review_status,
    l.claimed_status,
    l.created_at,
    l.updated_at
  FROM locations l
  WHERE l.review_status = 'approved'
    AND l.business_status IN ('OPERATIONAL', 'CLOSED_TEMPORARILY')
    AND l.google_rating IS NOT NULL
    AND l.review_count IS NOT NULL
  ORDER BY 
    -- Primary sort: weighted score (70% rating + 30% review count normalized)
    ((l.google_rating * 0.7) + (LEAST(l.review_count::NUMERIC / 100, 1) * 0.3)) DESC,
    -- Secondary sort: review count when scores are close
    l.review_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get locations grouped by city for a state
CREATE OR REPLACE FUNCTION get_locations_by_state_grouped(state_name TEXT)
RETURNS JSON AS $$
DECLARE
  result JSONB;
  city_data JSONB;
BEGIN
  -- Initialize result as empty JSONB object
  result := '{}'::jsonb;
  
  -- Loop through each city and build the structure
  FOR city_data IN
    SELECT 
      jsonb_build_object(
        'city', l.city,
        'locations', jsonb_agg(
          jsonb_build_object(
            'id', l.id,
            'name', l.name,
            'slug', l.slug,
            'city_slug', l.city_slug,
            'website_url', l.website_url,
            'phone', l.phone,
            'email', l.email,
            'street_address', l.street_address,
            'city', l.city,
            'state', l.state,
            'postal_code', l.postal_code,
            'country', l.country,
            'latitude', l.latitude,
            'longitude', l.longitude,
            'description', l.description,
            'business_type', l.business_type,
            'business_status', l.business_status,
            'google_rating', l.google_rating,
            'review_count', l.review_count,
            'reviews_tags', l.reviews_tags,
            'working_hours', l.working_hours,
            'price_level', l.price_level,
            'photo_url', l.photo_url,
            'logo_url', l.logo_url,
            'street_view_url', l.street_view_url,
            'reservation_urls', l.reservation_urls,
            'booking_appointment_url', l.booking_appointment_url,
            'menu_url', l.menu_url,
            'order_urls', l.order_urls,
            'location_url', l.location_url,
            'google_place_id', l.google_place_id,
            'google_id', l.google_id,
            'google_verified', l.google_verified,
            'review_status', l.review_status,
            'claimed_status', l.claimed_status,
            'created_at', l.created_at,
            'updated_at', l.updated_at
          ) ORDER BY l.name ASC
        )
      )
    FROM locations l
    WHERE l.review_status = 'approved'
      AND l.business_status IN ('OPERATIONAL', 'CLOSED_TEMPORARILY')
      AND l.state ILIKE '%' || state_name || '%'
    GROUP BY l.city
    ORDER BY l.city ASC
  LOOP
    result := result || jsonb_build_object(
      (city_data->>'city'),
      city_data->'locations'
    );
  END LOOP;
  
  RETURN result::json;
END;
$$ LANGUAGE plpgsql;

create or replace function public.location_review_stats(loc_id uuid)
returns table (
  total integer,
  recommended_count integer,
  percent_recommended integer,
  recent_comments jsonb
) as $$
begin
  return query
  select
    count(*)::int as total,
    count(*) filter (where recommended)::int as recommended_count,
    case when count(*) = 0 then 0 else round(100.0 * count(*) filter (where recommended) / count(*))::int end as percent_recommended,
    (
      select jsonb_agg(jsonb_build_object(
        'recommended', recommended,
        'comment', comment,
        'created_at', created_at,
        'review_user_id', review_user_id
      ))
      from (
        select recommended, comment, created_at, review_user_id
        from location_reviews
        where location_id = loc_id and status = 'approved' and comment is not null and comment <> ''
        order by created_at desc
        limit 5
      ) t
    ) as recent_comments
  from location_reviews
  where location_id = loc_id and status = 'approved';
end;
$$ language plpgsql stable;

CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;
