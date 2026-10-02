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
