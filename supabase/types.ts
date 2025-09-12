export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          email: string
          first_name: string
          last_name: string
          date_of_birth: string
          gender: 'male' | 'female' | 'other'
          interested_in: 'male' | 'female' | 'other' | 'everyone'
          bio: string | null
          year_of_study: number | null
          branch: string | null
          hometown: string | null
          height: number | null
          phone_number: string | null
          instagram_handle: string | null
          verification_status: 'pending' | 'verified' | 'rejected'
          verification_document_url: string | null
          is_verified: boolean
          is_active: boolean
          incognito_mode: boolean
          hide_year_branch: boolean
          latitude: number | null
          longitude: number | null
          last_active_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          first_name: string
          last_name: string
          date_of_birth: string
          gender: 'male' | 'female' | 'other'
          interested_in?: 'male' | 'female' | 'other' | 'everyone'
          bio?: string | null
          year_of_study?: number | null
          branch?: string | null
          hometown?: string | null
          height?: number | null
          phone_number?: string | null
          instagram_handle?: string | null
          verification_status?: 'pending' | 'verified' | 'rejected'
          verification_document_url?: string | null
          is_verified?: boolean
          is_active?: boolean
          incognito_mode?: boolean
          hide_year_branch?: boolean
          latitude?: number | null
          longitude?: number | null
          last_active_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          first_name?: string
          last_name?: string
          date_of_birth?: string
          gender?: 'male' | 'female' | 'other'
          interested_in?: 'male' | 'female' | 'other' | 'everyone'
          bio?: string | null
          year_of_study?: number | null
          branch?: string | null
          hometown?: string | null
          height?: number | null
          phone_number?: string | null
          instagram_handle?: string | null
          verification_status?: 'pending' | 'verified' | 'rejected'
          verification_document_url?: string | null
          is_verified?: boolean
          is_active?: boolean
          incognito_mode?: boolean
          hide_year_branch?: boolean
          latitude?: number | null
          longitude?: number | null
          last_active_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_photos: {
        Row: {
          id: string
          user_id: string
          photo_url: string
          photo_order: number
          is_primary: boolean
          is_verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          photo_url: string
          photo_order?: number
          is_primary?: boolean
          is_verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          photo_url?: string
          photo_order?: number
          is_primary?: boolean
          is_verified?: boolean
          created_at?: string
        }
      }
      user_interests: {
        Row: {
          id: string
          user_id: string
          interest: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          interest: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          interest?: string
          created_at?: string
        }
      }
      user_interactions: {
        Row: {
          id: string
          user_id: string
          target_user_id: string
          interaction_type: 'like' | 'pass' | 'superlike'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          target_user_id: string
          interaction_type: 'like' | 'pass' | 'superlike'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          target_user_id?: string
          interaction_type?: 'like' | 'pass' | 'superlike'
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          matched_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          matched_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          matched_at?: string
          is_active?: boolean
        }
      }
      conversations: {
        Row: {
          id: string
          match_id: string
          last_message_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          last_message_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          last_message_at?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          message_type: 'text' | 'image' | 'gif'
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          message_type?: 'text' | 'image' | 'gif'
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          message_type?: 'text' | 'image' | 'gif'
          is_read?: boolean
          created_at?: string
        }
      }
      elo_ratings: {
        Row: {
          id: string
          user_id: string
          rating: number
          matches_count: number
          wins: number
          losses: number
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          rating?: number
          matches_count?: number
          wins?: number
          losses?: number
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          rating?: number
          matches_count?: number
          wins?: number
          losses?: number
          updated_at?: string
          created_at?: string
        }
      }
      daily_limits: {
        Row: {
          id: string
          user_id: string
          date: string
          likes_used: number
          superlikes_used: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          likes_used?: number
          superlikes_used?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          likes_used?: number
          superlikes_used?: number
          created_at?: string
        }
      }
      email_otps: {
        Row: {
          id: string
          email: string
          otp: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          otp: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          otp?: string
          expires_at?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type UserPhoto = Database['public']['Tables']['user_photos']['Row'];
export type UserInterest = Database['public']['Tables']['user_interests']['Row'];
export type UserInteraction = Database['public']['Tables']['user_interactions']['Row'];
export type Match = Database['public']['Tables']['matches']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type EloRating = Database['public']['Tables']['elo_ratings']['Row'];
export type DailyLimit = Database['public']['Tables']['daily_limits']['Row'];
export type EmailOtp = Database['public']['Tables']['email_otps']['Row'];