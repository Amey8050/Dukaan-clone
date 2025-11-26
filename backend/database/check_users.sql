-- Check users in auth.users and user_profiles
-- Run this in Supabase SQL Editor to see all users

-- Check users in auth.users
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- Check users in user_profiles
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM user_profiles
ORDER BY created_at DESC;

-- Check if there are users in auth.users but not in user_profiles
SELECT 
  u.id,
  u.email,
  u.created_at as auth_created_at,
  CASE WHEN p.id IS NULL THEN 'MISSING PROFILE' ELSE 'PROFILE EXISTS' END as profile_status
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

