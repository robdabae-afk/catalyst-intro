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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cap_table_entries: {
        Row: {
          created_at: string | null
          equity_percentage: number | null
          founder_id: string
          id: string
          investment_amount: number
          investment_date: string | null
          investor_id: string
          safe_id: string | null
          updated_at: string | null
          valuation: number | null
        }
        Insert: {
          created_at?: string | null
          equity_percentage?: number | null
          founder_id: string
          id?: string
          investment_amount: number
          investment_date?: string | null
          investor_id: string
          safe_id?: string | null
          updated_at?: string | null
          valuation?: number | null
        }
        Update: {
          created_at?: string | null
          equity_percentage?: number | null
          founder_id?: string
          id?: string
          investment_amount?: number
          investment_date?: string | null
          investor_id?: string
          safe_id?: string | null
          updated_at?: string | null
          valuation?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cap_table_entries_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cap_table_entries_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cap_table_entries_safe_id_fkey"
            columns: ["safe_id"]
            isOneToOne: false
            referencedRelation: "safes"
            referencedColumns: ["id"]
          },
        ]
      }
      coffee_chats: {
        Row: {
          created_at: string | null
          founder_id: string
          id: string
          investor_id: string
          meeting_location: string | null
          notes: string | null
          proposed_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          founder_id: string
          id?: string
          investor_id: string
          meeting_location?: string | null
          notes?: string | null
          proposed_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          founder_id?: string
          id?: string
          investor_id?: string
          meeting_location?: string | null
          notes?: string | null
          proposed_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coffee_chats_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coffee_chats_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_profiles: {
        Row: {
          company_address: string | null
          company_name: string | null
          company_state: string | null
          created_at: string | null
          id: string
          industry: string | null
          one_liner: string
          pitch_deck_url: string | null
          preferred_city: string | null
          profile_id: string
          startup_name: string
          traction: string | null
        }
        Insert: {
          company_address?: string | null
          company_name?: string | null
          company_state?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          one_liner: string
          pitch_deck_url?: string | null
          preferred_city?: string | null
          profile_id: string
          startup_name: string
          traction?: string | null
        }
        Update: {
          company_address?: string | null
          company_name?: string | null
          company_state?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          one_liner?: string
          pitch_deck_url?: string | null
          preferred_city?: string | null
          profile_id?: string
          startup_name?: string
          traction?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "founder_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_profiles: {
        Row: {
          created_at: string | null
          firm_name: string | null
          id: string
          location: string | null
          portfolio_link: string | null
          preferred_stage: Database["public"]["Enums"]["funding_stage"] | null
          profile_id: string
          sectors_of_interest: string[] | null
          typical_check_size: string | null
        }
        Insert: {
          created_at?: string | null
          firm_name?: string | null
          id?: string
          location?: string | null
          portfolio_link?: string | null
          preferred_stage?: Database["public"]["Enums"]["funding_stage"] | null
          profile_id: string
          sectors_of_interest?: string[] | null
          typical_check_size?: string | null
        }
        Update: {
          created_at?: string | null
          firm_name?: string | null
          id?: string
          location?: string | null
          portfolio_link?: string | null
          preferred_stage?: Database["public"]["Enums"]["funding_stage"] | null
          profile_id?: string
          sectors_of_interest?: string[] | null
          typical_check_size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investor_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          name: string
          updated_at?: string | null
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      safes: {
        Row: {
          amount: number
          created_at: string | null
          discount_rate: number | null
          document_url: string | null
          execution_date: string | null
          founder_id: string
          founder_signature_data: string | null
          founder_signed_at: string | null
          id: string
          investor_id: string
          investor_signature_data: string | null
          investor_signed_at: string | null
          status: string | null
          updated_at: string | null
          valuation_cap: number | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          discount_rate?: number | null
          document_url?: string | null
          execution_date?: string | null
          founder_id: string
          founder_signature_data?: string | null
          founder_signed_at?: string | null
          id?: string
          investor_id: string
          investor_signature_data?: string | null
          investor_signed_at?: string | null
          status?: string | null
          updated_at?: string | null
          valuation_cap?: number | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          discount_rate?: number | null
          document_url?: string | null
          execution_date?: string | null
          founder_id?: string
          founder_signature_data?: string | null
          founder_signed_at?: string | null
          id?: string
          investor_id?: string
          investor_signature_data?: string | null
          investor_signed_at?: string | null
          status?: string | null
          updated_at?: string | null
          valuation_cap?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "safes_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safes_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      swipes: {
        Row: {
          action: string
          created_at: string
          id: string
          swiped_id: string
          swiper_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          swiped_id: string
          swiper_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          swiped_id?: string
          swiper_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_safe_content: { Args: { safe_id: string }; Returns: Json }
    }
    Enums: {
      funding_stage: "pre-seed" | "seed" | "series-a" | "series-b"
      user_type: "founder" | "investor"
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
      funding_stage: ["pre-seed", "seed", "series-a", "series-b"],
      user_type: ["founder", "investor"],
    },
  },
} as const
