-- ==========================================
-- COMPREHENSIVE PROFILE CASCADE DELETE FIXES
-- Clean up orphaned records & recreate foreign keys with ON DELETE CASCADE
-- ==========================================

-- ------------------------------------------
-- STEP 1: Purge orphaned rows that do not exist in the profiles table
-- ------------------------------------------
DELETE FROM public.community_members WHERE user_email NOT IN (SELECT email FROM public.profiles);
DELETE FROM public.community_messages WHERE sender_email NOT IN (SELECT email FROM public.profiles);
DELETE FROM public.news_posts WHERE user_email NOT IN (SELECT email FROM public.profiles);
DELETE FROM public.subscriptions WHERE user_email NOT IN (SELECT email FROM public.profiles);
DELETE FROM public.user_interests WHERE user_email NOT IN (SELECT email FROM public.profiles);
DELETE FROM public.user_photos WHERE user_email NOT IN (SELECT email FROM public.profiles);
DELETE FROM public.daily_limits WHERE email NOT IN (SELECT email FROM public.profiles);
DELETE FROM public.student_verifications WHERE email NOT IN (SELECT email FROM public.profiles);
DELETE FROM public.job_swipes WHERE user_email NOT IN (SELECT email FROM public.profiles);
DELETE FROM public.job_daily_slots WHERE user_email NOT IN (SELECT email FROM public.profiles);
DELETE FROM public.messages WHERE sender NOT IN (SELECT email FROM public.profiles);
DELETE FROM public.messages WHERE reciever NOT IN (SELECT email FROM public.profiles);

-- ------------------------------------------
-- STEP 2: Drop and recreate foreign keys with ON DELETE CASCADE
-- ------------------------------------------

-- 1. community_members
ALTER TABLE public.community_members 
DROP CONSTRAINT IF EXISTS community_members_user_email_fkey;

ALTER TABLE public.community_members 
ADD CONSTRAINT community_members_user_email_fkey 
FOREIGN KEY (user_email) 
REFERENCES public.profiles(email) 
ON DELETE CASCADE;

-- 2. community_messages
ALTER TABLE public.community_messages 
DROP CONSTRAINT IF EXISTS community_messages_sender_email_fkey;

ALTER TABLE public.community_messages 
ADD CONSTRAINT community_messages_sender_email_fkey 
FOREIGN KEY (sender_email) 
REFERENCES public.profiles(email) 
ON DELETE CASCADE;

-- 3. news_posts
ALTER TABLE public.news_posts 
DROP CONSTRAINT IF EXISTS news_posts_user_email_fkey;

ALTER TABLE public.news_posts 
ADD CONSTRAINT news_posts_user_email_fkey 
FOREIGN KEY (user_email) 
REFERENCES public.profiles(email) 
ON DELETE CASCADE;

-- 4. subscriptions
ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_user_email_fkey;

ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_user_email_fkey 
FOREIGN KEY (user_email) 
REFERENCES public.profiles(email) 
ON DELETE CASCADE;

-- 5. user_interests
ALTER TABLE public.user_interests 
DROP CONSTRAINT IF EXISTS user_interests_user_email_fkey;

ALTER TABLE public.user_interests 
ADD CONSTRAINT user_interests_user_email_fkey 
FOREIGN KEY (user_email) 
REFERENCES public.profiles(email) 
ON DELETE CASCADE;

-- 6. user_photos
ALTER TABLE public.user_photos 
DROP CONSTRAINT IF EXISTS user_photos_user_email_fkey;

ALTER TABLE public.user_photos 
ADD CONSTRAINT user_photos_user_email_fkey 
FOREIGN KEY (user_email) 
REFERENCES public.profiles(email) 
ON DELETE CASCADE;

-- 7. daily_limits
ALTER TABLE public.daily_limits 
DROP CONSTRAINT IF EXISTS daily_limits_email_fkey;

ALTER TABLE public.daily_limits 
ADD CONSTRAINT daily_limits_email_fkey 
FOREIGN KEY (email) 
REFERENCES public.profiles(email) 
ON DELETE CASCADE;

-- 8. student_verifications
ALTER TABLE public.student_verifications 
DROP CONSTRAINT IF EXISTS student_verifications_email_fkey;

ALTER TABLE public.student_verifications 
ADD CONSTRAINT student_verifications_email_fkey 
FOREIGN KEY (email) 
REFERENCES public.profiles(email) 
ON DELETE CASCADE;

-- 9. job_swipes
ALTER TABLE public.job_swipes 
DROP CONSTRAINT IF EXISTS job_swipes_user_email_fkey;

ALTER TABLE public.job_swipes 
ADD CONSTRAINT job_swipes_user_email_fkey 
FOREIGN KEY (user_email) 
REFERENCES public.profiles(email) 
ON DELETE CASCADE;

-- 10. job_daily_slots
ALTER TABLE public.job_daily_slots 
DROP CONSTRAINT IF EXISTS job_daily_slots_user_email_fkey;

ALTER TABLE public.job_daily_slots 
ADD CONSTRAINT job_daily_slots_user_email_fkey 
FOREIGN KEY (user_email) 
REFERENCES public.profiles(email) 
ON DELETE CASCADE;

-- 11. messages (sender and receiver)
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_sender_fkey,
DROP CONSTRAINT IF EXISTS messages_reciever_fkey;

ALTER TABLE public.messages 
ADD CONSTRAINT messages_sender_fkey 
FOREIGN KEY (sender) 
REFERENCES public.profiles(email) 
ON DELETE CASCADE,
ADD CONSTRAINT messages_reciever_fkey 
FOREIGN KEY (reciever) 
REFERENCES public.profiles(email) 
ON DELETE CASCADE;
