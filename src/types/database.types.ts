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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      products: {
        Row: {
          actives: string[]
          brand: string | null
          category: string
          created_at: string
          id: string
          ingredients: string[]
          is_favorite: boolean
          name: string
          notes: string | null
          opened_on: string | null
          packaging: string
          pao_months: number | null
          photo_path: string | null
          size_ml: number | null
          start_fraction: number
          status: string
          tracked_from: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actives?: string[]
          brand?: string | null
          category: string
          created_at?: string
          id?: string
          ingredients?: string[]
          is_favorite?: boolean
          name: string
          notes?: string | null
          opened_on?: string | null
          packaging: string
          pao_months?: number | null
          photo_path?: string | null
          size_ml?: number | null
          start_fraction?: number
          status: string
          tracked_from?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          actives?: string[]
          brand?: string | null
          category?: string
          created_at?: string
          id?: string
          ingredients?: string[]
          is_favorite?: boolean
          name?: string
          notes?: string | null
          opened_on?: string | null
          packaging?: string
          pao_months?: number | null
          photo_path?: string | null
          size_ml?: number | null
          start_fraction?: number
          status?: string
          tracked_from?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          concerns: string[]
          created_at: string
          display_name: string
          evening_reminder_enabled: boolean
          evening_reminder_time: string
          expiry_alerts_enabled: boolean
          id: string
          morning_reminder_enabled: boolean
          morning_reminder_time: string
          onboarding_completed_at: string | null
          ritual_style: string | null
          skin_type: string | null
          starter_categories: string[]
          theme: string
          updated_at: string
        }
        Insert: {
          concerns?: string[]
          created_at?: string
          display_name: string
          evening_reminder_enabled?: boolean
          evening_reminder_time?: string
          expiry_alerts_enabled?: boolean
          id: string
          morning_reminder_enabled?: boolean
          morning_reminder_time?: string
          onboarding_completed_at?: string | null
          ritual_style?: string | null
          skin_type?: string | null
          starter_categories?: string[]
          theme?: string
          updated_at?: string
        }
        Update: {
          concerns?: string[]
          created_at?: string
          display_name?: string
          evening_reminder_enabled?: boolean
          evening_reminder_time?: string
          expiry_alerts_enabled?: boolean
          id?: string
          morning_reminder_enabled?: boolean
          morning_reminder_time?: string
          onboarding_completed_at?: string | null
          ritual_style?: string | null
          skin_type?: string | null
          starter_categories?: string[]
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      routine_completions: {
        Row: {
          completed_at: string
          id: string
          local_date: string
          routine_step_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          local_date: string
          routine_step_id: string
          user_id?: string
        }
        Update: {
          completed_at?: string
          id?: string
          local_date?: string
          routine_step_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_completions_step_fkey"
            columns: ["routine_step_id", "user_id"]
            isOneToOne: false
            referencedRelation: "routine_steps"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      routine_steps: {
        Row: {
          created_at: string
          duration_seconds: number
          id: string
          note: string | null
          note_important: boolean
          period: string
          position: number
          product_id: string
          user_id: string
          wait_minutes: number | null
          weekdays: number[]
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          id?: string
          note?: string | null
          note_important?: boolean
          period: string
          position?: number
          product_id: string
          user_id?: string
          wait_minutes?: number | null
          weekdays?: number[]
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          id?: string
          note?: string | null
          note_important?: boolean
          period?: string
          position?: number
          product_id?: string
          user_id?: string
          wait_minutes?: number | null
          weekdays?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "routine_steps_product_fkey"
            columns: ["product_id", "user_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reorder_routine_steps: {
        Args: { p_period: string; p_step_ids: string[] }
        Returns: undefined
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
