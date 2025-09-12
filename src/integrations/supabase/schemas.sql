-- Enhanced Dating App Database Schema

-- User profiles table with enhanced fields
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  full_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  bio TEXT,
  photos TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  year INTEGER,
  branch TEXT,
  hometown TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_photos TEXT[] DEFAULT '{}',
  elo_rating INTEGER DEFAULT 1000,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stories table for temporary content
CREATE TABLE IF NOT EXISTS user_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Story views tracking
CREATE TABLE IF NOT EXISTS story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES user_stories(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

-- Video calls table
CREATE TABLE IF NOT EXISTS video_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID REFERENCES auth.users NOT NULL,
  receiver_id UUID REFERENCES auth.users NOT NULL,
  call_status TEXT NOT NULL CHECK (call_status IN ('calling', 'accepted', 'declined', 'ended', 'missed')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0
);

-- Enhanced user interactions with compatibility scores
CREATE TABLE IF NOT EXISTS user_interactions_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  target_user_id UUID REFERENCES auth.users NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'pass', 'superlike', 'block')),
  compatibility_score DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, target_user_id)
);

-- Real-time notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('match', 'message', 'like', 'superlike', 'story_view', 'video_call')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity tracking
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  activity_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stories_user_id ON user_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stories_expires_at ON user_stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_caller_receiver ON video_calls(caller_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view active stories" ON user_stories FOR SELECT USING (expires_at > NOW());
CREATE POLICY "Users can manage own stories" ON user_stories FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view story views for own stories" ON story_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_stories WHERE id = story_id AND user_id = auth.uid())
);
CREATE POLICY "Users can record story views" ON story_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Users can view own calls" ON video_calls FOR SELECT USING (
  auth.uid() = caller_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users can create calls" ON video_calls FOR INSERT WITH CHECK (auth.uid() = caller_id);
CREATE POLICY "Users can update calls they're part of" ON video_calls FOR UPDATE USING (
  auth.uid() = caller_id OR auth.uid() = receiver_id
);

CREATE POLICY "Users can view own interactions" ON user_interactions_enhanced FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create interactions" ON user_interactions_enhanced FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own activity" ON user_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create activity records" ON user_activity FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions for automatic cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS void AS $$
BEGIN
  DELETE FROM user_stories WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user activity
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles SET last_active = NOW() WHERE user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;