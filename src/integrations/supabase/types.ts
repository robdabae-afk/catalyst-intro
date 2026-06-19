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
      ad_profiles: {
        Row: {
          ad_type: Database["public"]["Enums"]["ad_profile_type"]
          banner_url: string | null
          company_name: string | null
          created_at: string | null
          created_by: string | null
          cta_text: string | null
          cta_url: string | null
          description: string | null
          external_company_name: string | null
          firm_name: string | null
          id: string
          image_url: string | null
          industry: string[] | null
          is_active: boolean | null
          linked_profile_id: string | null
          name: string
          one_liner: string | null
          portfolio_link: string | null
          sectors_of_interest: string[] | null
          service_description: string | null
          spotlight_duration:
            | Database["public"]["Enums"]["spotlight_duration"]
            | null
          spotlight_end_date: string | null
          spotlight_start_date: string | null
          stage: string | null
          typical_check_size: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          ad_type: Database["public"]["Enums"]["ad_profile_type"]
          banner_url?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          external_company_name?: string | null
          firm_name?: string | null
          id?: string
          image_url?: string | null
          industry?: string[] | null
          is_active?: boolean | null
          linked_profile_id?: string | null
          name: string
          one_liner?: string | null
          portfolio_link?: string | null
          sectors_of_interest?: string[] | null
          service_description?: string | null
          spotlight_duration?:
            | Database["public"]["Enums"]["spotlight_duration"]
            | null
          spotlight_end_date?: string | null
          spotlight_start_date?: string | null
          stage?: string | null
          typical_check_size?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          ad_type?: Database["public"]["Enums"]["ad_profile_type"]
          banner_url?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          external_company_name?: string | null
          firm_name?: string | null
          id?: string
          image_url?: string | null
          industry?: string[] | null
          is_active?: boolean | null
          linked_profile_id?: string | null
          name?: string
          one_liner?: string | null
          portfolio_link?: string | null
          sectors_of_interest?: string[] | null
          service_description?: string | null
          spotlight_duration?:
            | Database["public"]["Enums"]["spotlight_duration"]
            | null
          spotlight_end_date?: string | null
          spotlight_start_date?: string | null
          stage?: string | null
          typical_check_size?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_profiles_linked_profile_id_fkey"
            columns: ["linked_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
          sender_id: string | null
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
          sender_id?: string | null
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
          sender_id?: string | null
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
      concierge_inquiries: {
        Row: {
          budget: number
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string
          product_name: string
          service_name: string
          status: string | null
        }
        Insert: {
          budget: number
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          phone: string
          product_name: string
          service_name: string
          status?: string | null
        }
        Update: {
          budget?: number
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string
          product_name?: string
          service_name?: string
          status?: string | null
        }
        Relationships: []
      }
      deck_leads: {
        Row: {
          check_size: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          source: string
        }
        Insert: {
          check_size?: string | null
          created_at?: string
          email?: string
          id?: string
          name: string
          phone: string
          source: string
        }
        Update: {
          check_size?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          source?: string
        }
        Relationships: []
      }
      discover_resets: {
        Row: {
          reset_at: string
          user_id: string
        }
        Insert: {
          reset_at?: string
          user_id: string
        }
        Update: {
          reset_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_requests: {
        Row: {
          created_at: string
          file_url: string | null
          id: string
          message: string | null
          request_type: string
          requester_id: string
          response_message: string | null
          status: string
          target_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          id?: string
          message?: string | null
          request_type: string
          requester_id: string
          response_message?: string | null
          status?: string
          target_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_url?: string | null
          id?: string
          message?: string | null
          request_type?: string
          requester_id?: string
          response_message?: string | null
          status?: string
          target_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_attendees: {
        Row: {
          consent_accepted: boolean
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string
        }
        Insert: {
          consent_accepted?: boolean
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone: string
        }
        Update: {
          consent_accepted?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string
        }
        Relationships: []
      }
      feedback_prompts: {
        Row: {
          admin_requested_at: string | null
          created_at: string
          id: string
          last_feedback_at: string | null
          last_prompt_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_requested_at?: string | null
          created_at?: string
          id?: string
          last_feedback_at?: string | null
          last_prompt_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_requested_at?: string | null
          created_at?: string
          id?: string
          last_feedback_at?: string | null
          last_prompt_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      founder_profiles: {
        Row: {
          backed_by: string | null
          banner_url: string | null
          company_address: string | null
          company_name: string | null
          company_state: string | null
          created_at: string | null
          ein_number: string | null
          financial_statement_urls: string[] | null
          funding_amount: string | null
          id: string
          incorporation_doc_url: string | null
          industry: string[] | null
          location: string | null
          mrr: string | null
          one_liner: string
          pitch_deck_url: string | null
          pitch_deck_visibility: string
          preferred_city: string | null
          profile_id: string
          stage: Database["public"]["Enums"]["funding_stage"] | null
          startup_name: string
          traction: string | null
          video_url: string | null
        }
        Insert: {
          backed_by?: string | null
          banner_url?: string | null
          company_address?: string | null
          company_name?: string | null
          company_state?: string | null
          created_at?: string | null
          ein_number?: string | null
          financial_statement_urls?: string[] | null
          funding_amount?: string | null
          id?: string
          incorporation_doc_url?: string | null
          industry?: string[] | null
          location?: string | null
          mrr?: string | null
          one_liner: string
          pitch_deck_url?: string | null
          pitch_deck_visibility?: string
          preferred_city?: string | null
          profile_id: string
          stage?: Database["public"]["Enums"]["funding_stage"] | null
          startup_name: string
          traction?: string | null
          video_url?: string | null
        }
        Update: {
          backed_by?: string | null
          banner_url?: string | null
          company_address?: string | null
          company_name?: string | null
          company_state?: string | null
          created_at?: string | null
          ein_number?: string | null
          financial_statement_urls?: string[] | null
          funding_amount?: string | null
          id?: string
          incorporation_doc_url?: string | null
          industry?: string[] | null
          location?: string | null
          mrr?: string | null
          one_liner?: string
          pitch_deck_url?: string | null
          pitch_deck_visibility?: string
          preferred_city?: string | null
          profile_id?: string
          stage?: Database["public"]["Enums"]["funding_stage"] | null
          startup_name?: string
          traction?: string | null
          video_url?: string | null
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
          accreditation_status: string | null
          banner_url: string | null
          created_at: string | null
          firm_name: string | null
          id: string
          investment_count: number | null
          investment_thesis: string | null
          investor_type: string | null
          location: string | null
          notable_portfolio: string | null
          portfolio_link: string | null
          position: string | null
          preferred_stage: Database["public"]["Enums"]["funding_stage"] | null
          profile_id: string
          sectors_of_interest: string[] | null
          typical_check_size: string | null
        }
        Insert: {
          accreditation_status?: string | null
          banner_url?: string | null
          created_at?: string | null
          firm_name?: string | null
          id?: string
          investment_count?: number | null
          investment_thesis?: string | null
          investor_type?: string | null
          location?: string | null
          notable_portfolio?: string | null
          portfolio_link?: string | null
          position?: string | null
          preferred_stage?: Database["public"]["Enums"]["funding_stage"] | null
          profile_id: string
          sectors_of_interest?: string[] | null
          typical_check_size?: string | null
        }
        Update: {
          accreditation_status?: string | null
          banner_url?: string | null
          created_at?: string | null
          firm_name?: string | null
          id?: string
          investment_count?: number | null
          investment_thesis?: string | null
          investor_type?: string | null
          location?: string | null
          notable_portfolio?: string | null
          portfolio_link?: string | null
          position?: string | null
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
      location_access: {
        Row: {
          founder_id: string
          granted_at: string
          granted_to: string
          id: string
          revoked_at: string | null
        }
        Insert: {
          founder_id: string
          granted_at?: string
          granted_to: string
          id?: string
          revoked_at?: string | null
        }
        Update: {
          founder_id?: string
          granted_at?: string
          granted_to?: string
          id?: string
          revoked_at?: string | null
        }
        Relationships: []
      }
      manual_matches: {
        Row: {
          amount_paid: number | null
          created_at: string
          fulfilled_at: string | null
          fulfilled_by: string | null
          id: string
          matched_user_id: string | null
          payment_status: Database["public"]["Enums"]["manual_match_status"]
          payment_timestamp: string | null
          requester_id: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_type: string
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          matched_user_id?: string | null
          payment_status?: Database["public"]["Enums"]["manual_match_status"]
          payment_timestamp?: string | null
          requester_id: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_type: string
        }
        Update: {
          amount_paid?: number | null
          created_at?: string
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          matched_user_id?: string | null
          payment_status?: Database["public"]["Enums"]["manual_match_status"]
          payment_timestamp?: string | null
          requester_id?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_type?: string
        }
        Relationships: []
      }
      match_document_requests: {
        Row: {
          created_at: string
          doc_type: Database["public"]["Enums"]["match_doc_type"]
          file_path: string | null
          founder_id: string
          fulfilled_at: string | null
          id: string
          note: string | null
          requester_id: string
          status: Database["public"]["Enums"]["match_doc_status"]
          thread_id: string
        }
        Insert: {
          created_at?: string
          doc_type: Database["public"]["Enums"]["match_doc_type"]
          file_path?: string | null
          founder_id: string
          fulfilled_at?: string | null
          id?: string
          note?: string | null
          requester_id: string
          status?: Database["public"]["Enums"]["match_doc_status"]
          thread_id: string
        }
        Update: {
          created_at?: string
          doc_type?: Database["public"]["Enums"]["match_doc_type"]
          file_path?: string | null
          founder_id?: string
          fulfilled_at?: string | null
          id?: string
          note?: string | null
          requester_id?: string
          status?: Database["public"]["Enums"]["match_doc_status"]
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_document_requests_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "match_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_document_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "match_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_document_requests_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "match_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      match_event_attendees: {
        Row: {
          event_id: string
          id: string
          joined_at: string
          profile_id: string
        }
        Insert: {
          event_id: string
          id?: string
          joined_at?: string
          profile_id: string
        }
        Update: {
          event_id?: string
          id?: string
          joined_at?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "match_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_event_attendees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "match_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_events: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          name: string
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      match_founder_profiles: {
        Row: {
          created_at: string
          funding_amount: string | null
          id: string
          industry: string[] | null
          location: string | null
          one_liner: string | null
          pitch_deck_url: string | null
          profile_id: string
          stage: string | null
          startup_name: string | null
          traction: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          funding_amount?: string | null
          id?: string
          industry?: string[] | null
          location?: string | null
          one_liner?: string | null
          pitch_deck_url?: string | null
          profile_id: string
          stage?: string | null
          startup_name?: string | null
          traction?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          funding_amount?: string | null
          id?: string
          industry?: string[] | null
          location?: string | null
          one_liner?: string | null
          pitch_deck_url?: string | null
          profile_id?: string
          stage?: string | null
          startup_name?: string | null
          traction?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_founder_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "match_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_interests: {
        Row: {
          check_size_cents: number | null
          created_at: string
          event_id: string
          founder_id: string
          id: string
          investor_id: string
          message: string | null
        }
        Insert: {
          check_size_cents?: number | null
          created_at?: string
          event_id: string
          founder_id: string
          id?: string
          investor_id: string
          message?: string | null
        }
        Update: {
          check_size_cents?: number | null
          created_at?: string
          event_id?: string
          founder_id?: string
          id?: string
          investor_id?: string
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_interests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "match_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_interests_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "match_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_interests_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "match_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_investor_profiles: {
        Row: {
          accreditation: Database["public"]["Enums"]["match_accreditation"]
          avg_check_size: string | null
          created_at: string
          firm_name: string | null
          id: string
          philosophy: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          accreditation?: Database["public"]["Enums"]["match_accreditation"]
          avg_check_size?: string | null
          created_at?: string
          firm_name?: string | null
          id?: string
          philosophy?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          accreditation?: Database["public"]["Enums"]["match_accreditation"]
          avg_check_size?: string | null
          created_at?: string
          firm_name?: string | null
          id?: string
          philosophy?: string | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_investor_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "match_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_id: string
          thread_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_id: string
          thread_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "match_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "match_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      match_notifications: {
        Row: {
          created_at: string
          id: string
          payload: Json
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      match_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          role: Database["public"]["Enums"]["match_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          name: string
          role: Database["public"]["Enums"]["match_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["match_role"]
          updated_at?: string
        }
        Relationships: []
      }
      match_threads: {
        Row: {
          created_at: string
          event_id: string
          founder_id: string
          id: string
          investor_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          founder_id: string
          id?: string
          investor_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          founder_id?: string
          id?: string
          investor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_threads_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "match_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_threads_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "match_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_threads_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "match_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          first_message_at: string | null
          first_message_sender_id: string | null
          id: string
          marked_successful_at: string | null
          marked_successful_by: string | null
          status: Database["public"]["Enums"]["match_status"]
          unmatched_at: string | null
          unmatched_by: string | null
          updated_at: string
          user_1_id: string
          user_2_id: string
        }
        Insert: {
          created_at?: string
          first_message_at?: string | null
          first_message_sender_id?: string | null
          id?: string
          marked_successful_at?: string | null
          marked_successful_by?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          unmatched_at?: string | null
          unmatched_by?: string | null
          updated_at?: string
          user_1_id: string
          user_2_id: string
        }
        Update: {
          created_at?: string
          first_message_at?: string | null
          first_message_sender_id?: string | null
          id?: string
          marked_successful_at?: string | null
          marked_successful_by?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          unmatched_at?: string | null
          unmatched_by?: string | null
          updated_at?: string
          user_1_id?: string
          user_2_id?: string
        }
        Relationships: []
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
          admin_edit_message: string | null
          admin_edit_suggestion: string | null
          approved: boolean
          avatar_url: string | null
          bonus_swipes: number
          created_at: string | null
          early_access: boolean
          early_access_paid_at: string | null
          email: string
          filter_industries: string[] | null
          filter_locations: string[] | null
          filter_stages: string[] | null
          has_pending_update: boolean | null
          has_seen_welcome: boolean
          hidden_at: string | null
          hidden_by: string | null
          id: string
          is_featured: boolean | null
          is_flagged: boolean
          is_hidden: boolean
          is_test_account: boolean | null
          is_test_mode: boolean | null
          last_profile_update_at: string | null
          legal_accepted_at: string | null
          legal_accepted_ip: string | null
          legal_acknowledged: boolean | null
          linkedin_url: string | null
          match_banner_dismissed: boolean | null
          name: string
          onboarding_dismissed_at: string | null
          profile_grace_until: string | null
          referral_code: string
          referred_by: string | null
          rejection_reason: string | null
          spotlight_active_until: string | null
          spotlight_credits: number
          stripe_account_id: string | null
          stripe_customer_id: string | null
          stripe_onboarding_completed: boolean | null
          stripe_subscription_id: string | null
          subscription_expires_at: string | null
          subscription_plan: string | null
          subscription_status: string | null
          tokens: number
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"]
          weekly_initiations_count: number
          weekly_initiations_reset_at: string | null
          weekly_spotlight_used_at: string | null
        }
        Insert: {
          admin_edit_message?: string | null
          admin_edit_suggestion?: string | null
          approved?: boolean
          avatar_url?: string | null
          bonus_swipes?: number
          created_at?: string | null
          early_access?: boolean
          early_access_paid_at?: string | null
          email: string
          filter_industries?: string[] | null
          filter_locations?: string[] | null
          filter_stages?: string[] | null
          has_pending_update?: boolean | null
          has_seen_welcome?: boolean
          hidden_at?: string | null
          hidden_by?: string | null
          id: string
          is_featured?: boolean | null
          is_flagged?: boolean
          is_hidden?: boolean
          is_test_account?: boolean | null
          is_test_mode?: boolean | null
          last_profile_update_at?: string | null
          legal_accepted_at?: string | null
          legal_accepted_ip?: string | null
          legal_acknowledged?: boolean | null
          linkedin_url?: string | null
          match_banner_dismissed?: boolean | null
          name: string
          onboarding_dismissed_at?: string | null
          profile_grace_until?: string | null
          referral_code: string
          referred_by?: string | null
          rejection_reason?: string | null
          spotlight_active_until?: string | null
          spotlight_credits?: number
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          stripe_onboarding_completed?: boolean | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          tokens?: number
          updated_at?: string | null
          user_type: Database["public"]["Enums"]["user_type"]
          weekly_initiations_count?: number
          weekly_initiations_reset_at?: string | null
          weekly_spotlight_used_at?: string | null
        }
        Update: {
          admin_edit_message?: string | null
          admin_edit_suggestion?: string | null
          approved?: boolean
          avatar_url?: string | null
          bonus_swipes?: number
          created_at?: string | null
          early_access?: boolean
          early_access_paid_at?: string | null
          email?: string
          filter_industries?: string[] | null
          filter_locations?: string[] | null
          filter_stages?: string[] | null
          has_pending_update?: boolean | null
          has_seen_welcome?: boolean
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          is_featured?: boolean | null
          is_flagged?: boolean
          is_hidden?: boolean
          is_test_account?: boolean | null
          is_test_mode?: boolean | null
          last_profile_update_at?: string | null
          legal_accepted_at?: string | null
          legal_accepted_ip?: string | null
          legal_acknowledged?: boolean | null
          linkedin_url?: string | null
          match_banner_dismissed?: boolean | null
          name?: string
          onboarding_dismissed_at?: string | null
          profile_grace_until?: string | null
          referral_code?: string
          referred_by?: string | null
          rejection_reason?: string | null
          spotlight_active_until?: string | null
          spotlight_credits?: number
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          stripe_onboarding_completed?: boolean | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          tokens?: number
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
          weekly_initiations_count?: number
          weekly_initiations_reset_at?: string | null
          weekly_spotlight_used_at?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          approved_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_user_id: string | null
          referred_user_type: string | null
          referrer_id: string
          status: Database["public"]["Enums"]["referral_status"]
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_user_id?: string | null
          referred_user_type?: string | null
          referrer_id: string
          status?: Database["public"]["Enums"]["referral_status"]
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_user_id?: string | null
          referred_user_type?: string | null
          referrer_id?: string
          status?: Database["public"]["Enums"]["referral_status"]
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
          payment_status: Database["public"]["Enums"]["payment_status"] | null
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
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
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
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
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
      support_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          id: string
          status: Database["public"]["Enums"]["ticket_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_feedback: {
        Row: {
          created_at: string
          feedback_text: string | null
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_text?: string | null
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_text?: string | null
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          linkedin_url: string | null
          name: string
          user_type: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          linkedin_url?: string | null
          name: string
          user_type: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          linkedin_url?: string | null
          name?: string
          user_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_safe_content: { Args: { safe_id: string }; Returns: Json }
      get_active_ad_profiles: {
        Args: never
        Returns: {
          ad_type: Database["public"]["Enums"]["ad_profile_type"]
          banner_url: string
          company_name: string
          cta_text: string
          cta_url: string
          description: string
          external_company_name: string
          firm_name: string
          id: string
          image_url: string
          industry: string[]
          linked_profile_id: string
          name: string
          one_liner: string
          portfolio_link: string
          sectors_of_interest: string[]
          service_description: string
          stage: string
          typical_check_size: string
          website_url: string
        }[]
      }
      get_active_conversation_count: {
        Args: { user_id: string }
        Returns: number
      }
      get_approved_investor_referral_count: {
        Args: { user_id: string }
        Returns: number
      }
      get_founder_profile_with_access: {
        Args: { founder_profile_id: string }
        Returns: {
          banner_url: string
          company_address: string
          company_name: string
          company_state: string
          created_at: string
          id: string
          industry: string[]
          one_liner: string
          pitch_deck_url: string
          pitch_deck_visibility: string
          preferred_city: string
          profile_id: string
          stage: string
          startup_name: string
          traction: string
        }[]
      }
      get_public_profile: {
        Args: { profile_id: string }
        Returns: {
          avatar_url: string
          id: string
          name: string
          user_type: string
        }[]
      }
      get_public_profiles: {
        Args: { profile_ids: string[] }
        Returns: {
          avatar_url: string
          id: string
          name: string
          user_type: string
        }[]
      }
      get_referral_bonus_swipes: { Args: { user_id: string }; Returns: number }
      has_location_access: {
        Args: { founder_profile_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      investor_sent_first_message: {
        Args: { founder_id: string; match_id: string }
        Returns: boolean
      }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
      match_is_co_attendee: {
        Args: { _event_id: string; _user: string }
        Returns: boolean
      }
      match_is_thread_participant: {
        Args: { _thread: string; _user: string }
        Returns: boolean
      }
      match_share_active_event: {
        Args: { _a: string; _b: string }
        Returns: boolean
      }
    }
    Enums: {
      ad_profile_type: "startup" | "investment_fund" | "external"
      app_role: "admin" | "user"
      funding_stage: "pre-seed" | "seed" | "series-a" | "series-b"
      manual_match_status: "pending" | "paid" | "fulfilled" | "cancelled"
      match_accreditation: "accredited" | "institutional" | "none"
      match_doc_status: "pending" | "fulfilled" | "declined"
      match_doc_type:
        | "pitch_deck"
        | "cap_table"
        | "incorporation"
        | "financials"
        | "other"
      match_role: "founder" | "investor"
      match_status: "active" | "unmatched" | "successful_collaboration"
      payment_status: "pending" | "processing" | "completed"
      referral_status: "pending" | "approved" | "rejected"
      spotlight_duration: "1_day" | "1_week" | "1_month"
      ticket_status: "open" | "closed"
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
      ad_profile_type: ["startup", "investment_fund", "external"],
      app_role: ["admin", "user"],
      funding_stage: ["pre-seed", "seed", "series-a", "series-b"],
      manual_match_status: ["pending", "paid", "fulfilled", "cancelled"],
      match_accreditation: ["accredited", "institutional", "none"],
      match_doc_status: ["pending", "fulfilled", "declined"],
      match_doc_type: [
        "pitch_deck",
        "cap_table",
        "incorporation",
        "financials",
        "other",
      ],
      match_role: ["founder", "investor"],
      match_status: ["active", "unmatched", "successful_collaboration"],
      payment_status: ["pending", "processing", "completed"],
      referral_status: ["pending", "approved", "rejected"],
      spotlight_duration: ["1_day", "1_week", "1_month"],
      ticket_status: ["open", "closed"],
      user_type: ["founder", "investor"],
    },
  },
} as const
