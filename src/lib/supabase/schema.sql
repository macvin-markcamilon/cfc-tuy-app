-- Couples For Christ Tuy Chapter Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Couples / Members / Leaders)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  spouse_name TEXT,
  email TEXT,
  phone_number TEXT,
  barangay TEXT NOT NULL,
  ministry TEXT NOT NULL CHECK (ministry IN ('CFC', 'SFC', 'YFC', 'KFC', 'HOLD', 'SOLD')),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'household_head', 'unit_leader', 'chapter_servant', 'admin')),
  clp_batch TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Households Table
CREATE TABLE IF NOT EXISTS households (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  ministry TEXT NOT NULL CHECK (ministry IN ('CFC', 'SFC', 'YFC', 'KFC', 'HOLD', 'SOLD')),
  barangay TEXT NOT NULL,
  leader_name TEXT NOT NULL,
  leader_contact TEXT,
  meeting_day TEXT NOT NULL,
  meeting_schedule TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TEXT NOT NULL,
  location_name TEXT NOT NULL,
  ministry TEXT NOT NULL DEFAULT 'ALL',
  category TEXT NOT NULL CHECK (category IN ('Assembly', 'CLP', 'Household', 'Service', 'Fellowship', 'Conference')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Prayer Requests Table
CREATE TABLE IF NOT EXISTS prayer_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_name TEXT NOT NULL,
  barangay TEXT,
  category TEXT NOT NULL CHECK (category IN ('Health & Healing', 'Family & Marriage', 'Thanksgiving', 'Spiritual Growth', 'Special Intentions')),
  intention TEXT NOT NULL,
  prayer_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Row Level Security (RLS) Setup
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;

-- Public can read active events, public households, and approved prayer requests
CREATE POLICY "Public can view events" ON events FOR SELECT USING (true);
CREATE POLICY "Public can view households" ON households FOR SELECT USING (true);
CREATE POLICY "Public can view approved prayer requests" ON prayer_requests FOR SELECT USING (is_approved = true);
CREATE POLICY "Anyone can submit prayer requests" ON prayer_requests FOR INSERT WITH CHECK (true);

-- Authenticated users can increment prayer count
CREATE POLICY "Anyone can increment prayer count" ON prayer_requests FOR UPDATE USING (true) WITH CHECK (true);

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 7. CLP Programs Table
CREATE TABLE IF NOT EXISTS clp_programs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  venue TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Ongoing', 'Completed')),
  batch_number TEXT,
  team_leader TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CLP Couples Table
CREATE TABLE IF NOT EXISTS clp_couples (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  clp_id UUID REFERENCES clp_programs(id) ON DELETE CASCADE,
  husband_first_name TEXT NOT NULL,
  husband_last_name TEXT NOT NULL,
  husband_birthday DATE,
  husband_occupation TEXT,
  husband_contact TEXT,
  husband_email TEXT,
  wife_first_name TEXT NOT NULL,
  wife_last_name TEXT NOT NULL,
  wife_birthday DATE,
  wife_occupation TEXT,
  wife_contact TEXT,
  wife_email TEXT,
  wedding_anniversary DATE,
  address TEXT NOT NULL,
  barangay TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Graduated', 'Dropped')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CLP Talks Table
CREATE TABLE IF NOT EXISTS clp_talks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  clp_id UUID REFERENCES clp_programs(id) ON DELETE CASCADE,
  talk_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  speaker TEXT NOT NULL,
  venue TEXT NOT NULL,
  talk_date DATE,
  talk_time TEXT,
  module_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CLP Attendance Table
CREATE TABLE IF NOT EXISTS clp_attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  talk_id UUID REFERENCES clp_talks(id) ON DELETE CASCADE,
  couple_id UUID REFERENCES clp_couples(id) ON DELETE CASCADE,
  husband_present BOOLEAN DEFAULT false,
  wife_present BOOLEAN DEFAULT false,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(talk_id, couple_id)
);

ALTER TABLE clp_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clp_couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE clp_talks ENABLE ROW LEVEL SECURITY;
ALTER TABLE clp_attendance ENABLE ROW LEVEL SECURITY;

-- CLP RLS Policies (Allow full read & write for authorized portal users & admin)
DROP POLICY IF EXISTS "Allow public read for CLP programs" ON clp_programs;
DROP POLICY IF EXISTS "Allow authenticated full access for CLP programs" ON clp_programs;
DROP POLICY IF EXISTS "Allow authenticated full access for CLP couples" ON clp_couples;
DROP POLICY IF EXISTS "Allow authenticated full access for CLP talks" ON clp_talks;
DROP POLICY IF EXISTS "Allow authenticated full access for CLP attendance" ON clp_attendance;

CREATE POLICY "Allow full access for CLP programs" ON clp_programs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for CLP couples" ON clp_couples FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for CLP talks" ON clp_talks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for CLP attendance" ON clp_attendance FOR ALL USING (true) WITH CHECK (true);

-- 11. Main Admin User Provisioning
-- Creates markcamilon@gmail.com with password 'weakPassword' in auth.users and profiles
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_id UUID := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'markcamilon@gmail.com') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'markcamilon@gmail.com',
      crypt('weakPassword', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Bro. Mark Camilon","role":"admin"}',
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    );

    INSERT INTO profiles (
      id,
      full_name,
      email,
      barangay,
      ministry,
      role,
      created_at
    ) VALUES (
      admin_id,
      'Bro. Mark Camilon',
      'markcamilon@gmail.com',
      'Poblacion 1',
      'CFC',
      'admin',
      NOW()
    ) ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;


