-- Create profiles table with comprehensive user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')) NOT NULL,
  interested_in TEXT CHECK (interested_in IN ('male', 'female', 'other', 'everyone')) NOT NULL DEFAULT 'everyone',
  bio TEXT,
  year_of_study INTEGER CHECK (year_of_study BETWEEN 1 AND 6),
  branch TEXT,
  hometown TEXT,
  height INTEGER, -- height in cm
  phone_number TEXT,
  instagram_handle TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_document_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  incognito_mode BOOLEAN DEFAULT false,
  hide_year_branch BOOLEAN DEFAULT false,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view verified active profiles" 
ON public.profiles 
FOR SELECT 
USING (is_verified = true AND is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample profiles for testing
INSERT INTO public.profiles (
  user_id, email, first_name, last_name, date_of_birth, gender, interested_in,
  bio, year_of_study, branch, hometown, height, is_verified, is_active
) VALUES 
(
  gen_random_uuid(),
  'priya.sharma@nitkkr.ac.in',
  'Priya',
  'Sharma',
  '2004-03-15',
  'female',
  'male',
  'Computer Science enthusiast who loves coding, coffee, and deep conversations. Always up for exploring new places around Kurukshetra!',
  3,
  'Computer Science',
  'Delhi',
  168,
  true,
  true
),
(
  gen_random_uuid(),
  'ankit.kumar@nitkkr.ac.in', 
  'Ankit',
  'Kumar',
  '2003-07-22',
  'male',
  'female',
  'Mechanical Engineering student with a passion for motorcycles and adventure. Weekend warrior who loves long rides to nowhere.',
  4,
  'Mechanical Engineering',
  'Jaipur',
  180,
  true,
  true
),
(
  gen_random_uuid(),
  'sneha.patel@nitkkr.ac.in',
  'Sneha', 
  'Patel',
  '2005-11-08',
  'female',
  'everyone',
  'Electrical Engineering student passionate about sustainable technology and making the world greener. Classical dancer and food enthusiast.',
  2,
  'Electrical Engineering', 
  'Ahmedabad',
  163,
  true,
  true
),
(
  gen_random_uuid(),
  'rahul.mishra@nitkkr.ac.in',
  'Rahul',
  'Mishra', 
  '2002-05-14',
  'male',
  'female',
  'Final year Civil Engineering student who loves building things. Guitarist, cricket enthusiast, and hopeless romantic.',
  4,
  'Civil Engineering',
  'Lucknow',
  183,
  true,
  true
),
(
  gen_random_uuid(),
  'kavya.singh@nitkkr.ac.in',
  'Kavya',
  'Singh',
  '2004-09-30', 
  'female',
  'male',
  'Biotechnology student fascinated by the mysteries of life at molecular level. Aspiring researcher, amateur poet, and chai addict.',
  3,
  'Biotechnology',
  'Chandigarh',
  165,
  true,
  true
);

-- Update user_photos table to reference profiles
INSERT INTO public.user_photos (user_id, photo_url, photo_order, is_primary, is_verified) 
SELECT 
  user_id,
  CASE 
    WHEN first_name = 'Priya' THEN 'https://images.unsplash.com/photo-1494790108755-2616c64d5057?w=400&h=600&fit=crop&crop=face'
    WHEN first_name = 'Ankit' THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face'
    WHEN first_name = 'Sneha' THEN 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face'
    WHEN first_name = 'Rahul' THEN 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face'
    WHEN first_name = 'Kavya' THEN 'https://images.unsplash.com/photo-1485875437342-9ba56309fff8?w=400&h=600&fit=crop&crop=face'
  END,
  1,
  true,
  true
FROM public.profiles 
WHERE first_name IN ('Priya', 'Ankit', 'Sneha', 'Rahul', 'Kavya');

-- Add interests for sample profiles
INSERT INTO public.user_interests (user_id, interest)
SELECT p.user_id, unnest(ARRAY['coding', 'coffee', 'photography', 'travel', 'books', 'music'])
FROM public.profiles p WHERE p.first_name = 'Priya'
UNION ALL
SELECT p.user_id, unnest(ARRAY['motorcycles', 'adventure', 'mechanics', 'fitness', 'travel'])
FROM public.profiles p WHERE p.first_name = 'Ankit'
UNION ALL  
SELECT p.user_id, unnest(ARRAY['sustainability', 'classical dance', 'renewable energy', 'cooking', 'yoga'])
FROM public.profiles p WHERE p.first_name = 'Sneha'
UNION ALL
SELECT p.user_id, unnest(ARRAY['architecture', 'guitar', 'cricket', 'photography', 'music'])
FROM public.profiles p WHERE p.first_name = 'Rahul'
UNION ALL
SELECT p.user_id, unnest(ARRAY['biotechnology', 'research', 'poetry', 'philosophy', 'chai'])
FROM public.profiles p WHERE p.first_name = 'Kavya';