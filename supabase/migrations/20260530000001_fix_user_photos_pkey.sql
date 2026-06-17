-- ==========================================
-- FIX USER PHOTOS PRIMARY KEY CONSTRAINT
-- ==========================================

-- 1. De-duplicate any accidental duplicate records of the same user_email and photo_order.
-- Keeps the first inserted row (smaller ctid) and removes subsequent ones.
DELETE FROM public.user_photos a
USING public.user_photos b
WHERE a.user_email = b.user_email
  AND a.photo_order = b.photo_order
  AND a.ctid < b.ctid;

-- 2. Drop the existing primary key constraint user_photos_pkey
ALTER TABLE public.user_photos DROP CONSTRAINT IF EXISTS user_photos_pkey;

-- 3. Add the composite primary key on (user_email, photo_order)
-- This allows each user to have multiple photos, each assigned to a different order slot (1, 2, 3, etc.).
ALTER TABLE public.user_photos ADD CONSTRAINT user_photos_pkey PRIMARY KEY (user_email, photo_order);
