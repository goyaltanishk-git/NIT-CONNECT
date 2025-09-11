export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      daily_limits: {
        Row: {
          date: string
          id: string
          likes_used: number | null
          superlikes_used: number | null
          user_id: string
        }
        Insert: {
          date?: string
          id?: string
          likes_used?: number | null
          superlikes_used?: number | null
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          likes_used?: number | null
          superlikes_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      elo_ratings: {
        Row: {
          id: string
          last_updated: string | null
          likes_given: number | null
          likes_received: number | null
          matches_count: number | null
          rating: number | null
          user_id: string
        }
        Insert: {
          id?: string
          last_updated?: string | null
          likes_given?: number | null
          likes_received?: number | null
          matches_count?: number | null
          rating?: number | null
          user_id: string
        }
        Update: {
          id?: string
          last_updated?: string | null
          likes_given?: number | null
          likes_received?: number | null
          matches_count?: number | null
          rating?: number | null
          user_id?: string
        }
        Relationships: []
      }
      email_otps: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          otp: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          otp: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          otp?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_url: string | null
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          match_id: string
          message_type: string | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          attachment_url?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          match_id: string
          message_type?: string | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          attachment_url?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          match_id?: string
          message_type?: string | null
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          branch: string | null
          created_at: string | null
          date_of_birth: string
          email: string
          first_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          height: number | null
          hide_year_branch: boolean | null
          hometown: string | null
          id: string
          incognito_mode: boolean | null
          instagram_handle: string | null
          interested_in: Database["public"]["Enums"]["gender_type"]
          is_active: boolean | null
          is_verified: boolean | null
          last_active_at: string | null
          last_name: string
          latitude: number | null
          longitude: number | null
          phone_number: string | null
          updated_at: string | null
          user_id: string
          verification_document_url: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          year_of_study: string | null
        }
        Insert: {
          bio?: string | null
          branch?: string | null
          created_at?: string | null
          date_of_birth: string
          email: string
          first_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          height?: number | null
          hide_year_branch?: boolean | null
          hometown?: string | null
          id?: string
          incognito_mode?: boolean | null
          instagram_handle?: string | null
          interested_in?: Database["public"]["Enums"]["gender_type"]
          is_active?: boolean | null
          is_verified?: boolean | null
          last_active_at?: string | null
          last_name: string
          latitude?: number | null
          longitude?: number | null
          phone_number?: string | null
          updated_at?: string | null
          user_id: string
          verification_document_url?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          year_of_study?: string | null
        }
        Update: {
          bio?: string | null
          branch?: string | null
          created_at?: string | null
          date_of_birth?: string
          email?: string
          first_name?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          height?: number | null
          hide_year_branch?: boolean | null
          hometown?: string | null
          id?: string
          incognito_mode?: boolean | null
          instagram_handle?: string | null
          interested_in?: Database["public"]["Enums"]["gender_type"]
          is_active?: boolean | null
          is_verified?: boolean | null
          last_active_at?: string | null
          last_name?: string
          latitude?: number | null
          longitude?: number | null
          phone_number?: string | null
          updated_at?: string | null
          user_id?: string
          verification_document_url?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          year_of_study?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          category: Database["public"]["Enums"]["report_category"]
          created_at: string | null
          description: string | null
          id: string
          reported_user_id: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["report_category"]
          created_at?: string | null
          description?: string | null
          id?: string
          reported_user_id: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["report_category"]
          created_at?: string | null
          description?: string | null
          id?: string
          reported_user_id?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          target_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          target_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: Database["public"]["Enums"]["interaction_type"]
          target_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_interests: {
        Row: {
          created_at: string | null
          id: string
          interest: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interest: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interest?: string
          user_id?: string
        }
        Relationships: []
      }
      user_photos: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          is_verified: boolean | null
          photo_order: number
          photo_url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          photo_order: number
          photo_url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          photo_order?: number
          photo_url?: string
          user_id?: string
        }
        Relationships: []
      }
      user_prompts: {
        Row: {
          created_at: string | null
          id: string
          prompt_answer: string
          prompt_order: number
          prompt_question: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          prompt_answer: string
          prompt_order: number
          prompt_question: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          prompt_answer?: string
          prompt_order?: number
          prompt_question?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      gender_type: "male" | "female"
      interaction_type: "like" | "pass" | "superlike" | "block"
      report_category:
        | "harassment"
        | "inappropriate_content"
        | "fake_profile"
        | "spam"
        | "other"
      verification_status: "pending" | "verified" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      gender_type: ["male", "female"],
      interaction_type: ["like", "pass", "superlike", "block"],
      report_category: [
        "harassment",
        "inappropriate_content",
        "fake_profile",
        "spam",
        "other",
      ],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
