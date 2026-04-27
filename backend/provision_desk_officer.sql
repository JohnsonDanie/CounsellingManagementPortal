-- INSTRUCTIONS FOR PROVISIONING A DESK OFFICER
-- Since we removed public sign-ups for Desk Officers to secure the platform, 
-- you must manually provision them via your Supabase Dashboard.

-- STEP 1: Go to "Authentication" -> "Users" in Supabase and click "Invite User" or "Add User".
-- Add the Desk Officer's email address and password.
-- STEP 2: Copy their new generic User UUID.
-- STEP 3: Run the following SQL script in the SQL Editor to assign their admin role and name.

-- WARNING: Replace the UUID and the strings below with the actual data.
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  'PASTE-THE-UUID-HERE',          -- ID copied from Step 2
  'officer@nileuniversity.edu.ng', -- Their email
  'Admin Officer',                 -- Their Name
  'desk_officer'                   -- Critical role assignment
)
ON CONFLICT (id) DO UPDATE 
SET role = 'desk_officer', full_name = EXCLUDED.full_name;
