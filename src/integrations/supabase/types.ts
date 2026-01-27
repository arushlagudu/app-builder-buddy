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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analysis_history: {
        Row: {
          avoid_ingredients: Json | null
          climate: string | null
          concerns: string[] | null
          created_at: string
          deep_analysis: string | null
          id: string
          image_url: string | null
          pollution: string | null
          prescription_ingredients: Json | null
          problems: Json | null
          routine: Json | null
          score: number | null
          skin_type: string | null
          user_id: string
        }
        Insert: {
          avoid_ingredients?: Json | null
          climate?: string | null
          concerns?: string[] | null
          created_at?: string
          deep_analysis?: string | null
          id?: string
          image_url?: string | null
          pollution?: string | null
          prescription_ingredients?: Json | null
          problems?: Json | null
          routine?: Json | null
          score?: number | null
          skin_type?: string | null
          user_id: string
        }
        Update: {
          avoid_ingredients?: Json | null
          climate?: string | null
          concerns?: string[] | null
          created_at?: string
          deep_analysis?: string | null
          id?: string
          image_url?: string | null
          pollution?: string | null
          prescription_ingredients?: Json | null
          problems?: Json | null
          routine?: Json | null
          score?: number | null
          skin_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_tips: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          tip_type: string
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          tip_type: string
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          tip_type?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_routines: {
        Row: {
          concerns: string[] | null
          created_at: string
          evening_routine: Json | null
          id: string
          intensity: string | null
          morning_routine: Json | null
          routine_summary: string | null
          routine_title: string | null
          routine_type: string
          score: number | null
          skin_type: string | null
          tips: Json | null
          user_id: string
          weekly_treatments: Json | null
        }
        Insert: {
          concerns?: string[] | null
          created_at?: string
          evening_routine?: Json | null
          id?: string
          intensity?: string | null
          morning_routine?: Json | null
          routine_summary?: string | null
          routine_title?: string | null
          routine_type?: string
          score?: number | null
          skin_type?: string | null
          tips?: Json | null
          user_id: string
          weekly_treatments?: Json | null
        }
        Update: {
          concerns?: string[] | null
          created_at?: string
          evening_routine?: Json | null
          id?: string
          intensity?: string | null
          morning_routine?: Json | null
          routine_summary?: string | null
          routine_title?: string | null
          routine_type?: string
          score?: number | null
          skin_type?: string | null
          tips?: Json | null
          user_id?: string
          weekly_treatments?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          analysis_id: string | null
          created_at: string
          id: string
          image_url: string
          notes: string | null
          skin_score: number | null
          user_id: string
        }
        Insert: {
          analysis_id?: string | null
          created_at?: string
          id?: string
          image_url: string
          notes?: string | null
          skin_score?: number | null
          user_id: string
        }
        Update: {
          analysis_id?: string | null
          created_at?: string
          id?: string
          image_url?: string
          notes?: string | null
          skin_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_photos_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analysis_history"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_streaks: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          routine_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          routine_type: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          routine_type?: string
          user_id?: string
        }
        Relationships: []
      }
      scanned_products: {
        Row: {
          brand: string | null
          compatibility_score: number | null
          conflicts: Json | null
          created_at: string
          id: string
          image_url: string | null
          ingredients: string[] | null
          product_name: string | null
          recommendations: Json | null
          user_id: string
        }
        Insert: {
          brand?: string | null
          compatibility_score?: number | null
          conflicts?: Json | null
          created_at?: string
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          product_name?: string | null
          recommendations?: Json | null
          user_id: string
        }
        Update: {
          brand?: string | null
          compatibility_score?: number | null
          conflicts?: Json | null
          created_at?: string
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          product_name?: string | null
          recommendations?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          scans_reset_at: string
          scans_used: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          scans_reset_at?: string
          scans_used?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          scans_reset_at?: string
          scans_used?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_streak_stats: {
        Row: {
          current_streak: number
          id: string
          last_completion_date: string | null
          longest_streak: number
          total_completions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          id?: string
          last_completion_date?: string | null
          longest_streak?: number
          total_completions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          id?: string
          last_completion_date?: string | null
          longest_streak?: number
          total_completions?: number
          updated_at?: string
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
