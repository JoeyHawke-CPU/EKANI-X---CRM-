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
      leads: {
        Row: {
          add_ons: string | null
          area: string | null
          budget_confirmed: boolean
          business_full_address: string | null
          client_business_name: string
          client_contact_person: string | null
          commission_amount_kwd: number | null
          commission_eligible: boolean | null
          commission_percentage: number
          created_at: string
          date_added: string
          days_to_close: number | null
          decision_maker_confirmed: boolean
          domain_status: string | null
          email: string | null
          escalation_required: boolean
          final_agreed_amount_kd: number
          followup_7day_completed: boolean
          followup_due_date: string | null
          go_live_date: string | null
          governorate: string | null
          intake_form_completed: boolean
          invoice_generated: boolean
          lead_id: number
          lead_source: string | null
          payment_link_sent: boolean
          payment_received: boolean
          phone_number: string | null
          preview_sent_date: string | null
          production_deadline: string | null
          quoted_amount_kd: number
          refund_cancellation: boolean
          remarks: string | null
          sales_exec_id: string
          solution_selected: string | null
          status: Database["public"]["Enums"]["lead_status"]
          timeline_days: number | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          add_ons?: string | null
          area?: string | null
          budget_confirmed?: boolean
          business_full_address?: string | null
          client_business_name: string
          client_contact_person?: string | null
          commission_amount_kwd?: number | null
          commission_eligible?: boolean | null
          commission_percentage?: number
          created_at?: string
          date_added?: string
          days_to_close?: number | null
          decision_maker_confirmed?: boolean
          domain_status?: string | null
          email?: string | null
          escalation_required?: boolean
          final_agreed_amount_kd?: number
          followup_7day_completed?: boolean
          followup_due_date?: string | null
          go_live_date?: string | null
          governorate?: string | null
          intake_form_completed?: boolean
          invoice_generated?: boolean
          lead_id?: number
          lead_source?: string | null
          payment_link_sent?: boolean
          payment_received?: boolean
          phone_number?: string | null
          preview_sent_date?: string | null
          production_deadline?: string | null
          quoted_amount_kd?: number
          refund_cancellation?: boolean
          remarks?: string | null
          sales_exec_id: string
          solution_selected?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          timeline_days?: number | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          add_ons?: string | null
          area?: string | null
          budget_confirmed?: boolean
          business_full_address?: string | null
          client_business_name?: string
          client_contact_person?: string | null
          commission_amount_kwd?: number | null
          commission_eligible?: boolean | null
          commission_percentage?: number
          created_at?: string
          date_added?: string
          days_to_close?: number | null
          decision_maker_confirmed?: boolean
          domain_status?: string | null
          email?: string | null
          escalation_required?: boolean
          final_agreed_amount_kd?: number
          followup_7day_completed?: boolean
          followup_due_date?: string | null
          go_live_date?: string | null
          governorate?: string | null
          intake_form_completed?: boolean
          invoice_generated?: boolean
          lead_id?: number
          lead_source?: string | null
          payment_link_sent?: boolean
          payment_received?: boolean
          phone_number?: string | null
          preview_sent_date?: string | null
          production_deadline?: string | null
          quoted_amount_kd?: number
          refund_cancellation?: boolean
          remarks?: string | null
          sales_exec_id?: string
          solution_selected?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          timeline_days?: number | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_sales_exec_id_fkey"
            columns: ["sales_exec_id"]
            isOneToOne: false
            referencedRelation: "sales_executives"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sales_executives: {
        Row: {
          active_status: boolean
          civil_id: string | null
          clients_visited_count: number
          commission_default_percentage: number
          contact_number: string | null
          created_at: string
          date_joined: string
          email: string
          full_name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          active_status?: boolean
          civil_id?: string | null
          clients_visited_count?: number
          commission_default_percentage?: number
          contact_number?: string | null
          created_at?: string
          date_joined?: string
          email: string
          full_name: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          active_status?: boolean
          civil_id?: string | null
          clients_visited_count?: number
          commission_default_percentage?: number
          contact_number?: string | null
          created_at?: string
          date_joined?: string
          email?: string
          full_name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_admin_leads_export: {
        Row: {
          add_ons: string | null
          area: string | null
          budget_confirmed: boolean | null
          business_full_address: string | null
          client_business_name: string | null
          client_contact_person: string | null
          commission_amount_kwd: number | null
          commission_eligible: boolean | null
          commission_percentage: number | null
          created_at: string | null
          date_added: string | null
          days_to_close: number | null
          decision_maker_confirmed: boolean | null
          domain_status: string | null
          email: string | null
          escalation_required: boolean | null
          final_agreed_amount_kd: number | null
          followup_7day_completed: boolean | null
          followup_due_date: string | null
          go_live_date: string | null
          governorate: string | null
          intake_form_completed: boolean | null
          invoice_generated: boolean | null
          lead_id: number | null
          lead_source: string | null
          payment_link_sent: boolean | null
          payment_received: boolean | null
          phone_number: string | null
          preview_sent_date: string | null
          production_deadline: string | null
          quoted_amount_kd: number | null
          refund_cancellation: boolean | null
          remarks: string | null
          sales_executive_name: string | null
          solution_selected: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          timeline_days: number | null
          whatsapp_number: string | null
        }
        Relationships: []
      }
      v_commission_payout_report: {
        Row: {
          client_business_name: string | null
          commission_amount_kwd: number | null
          commission_eligible: boolean | null
          commission_percentage: number | null
          date_added: string | null
          final_agreed_amount_kd: number | null
          go_live_date: string | null
          lead_id: number | null
          payment_received: boolean | null
          refund_cancellation: boolean | null
          sales_executive_email: string | null
          sales_executive_name: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
        }
        Relationships: []
      }
      v_my_leads_export: {
        Row: {
          add_ons: string | null
          area: string | null
          budget_confirmed: boolean | null
          business_full_address: string | null
          client_business_name: string | null
          client_contact_person: string | null
          commission_amount_kwd: number | null
          commission_eligible: boolean | null
          commission_percentage: number | null
          created_at: string | null
          date_added: string | null
          days_to_close: number | null
          decision_maker_confirmed: boolean | null
          domain_status: string | null
          email: string | null
          escalation_required: boolean | null
          final_agreed_amount_kd: number | null
          followup_7day_completed: boolean | null
          followup_due_date: string | null
          go_live_date: string | null
          governorate: string | null
          intake_form_completed: boolean | null
          invoice_generated: boolean | null
          lead_id: number | null
          lead_source: string | null
          payment_link_sent: boolean | null
          payment_received: boolean | null
          phone_number: string | null
          preview_sent_date: string | null
          production_deadline: string | null
          quoted_amount_kd: number | null
          refund_cancellation: boolean | null
          remarks: string | null
          sales_executive_name: string | null
          solution_selected: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          timeline_days: number | null
          whatsapp_number: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_admin: { Args: { uid: string }; Returns: boolean }
    }
    Enums: {
      lead_status:
        | "New Lead"
        | "Contacted"
        | "Follow-Up"
        | "Meeting Scheduled"
        | "Nurture"
        | "Deal Confirmed – Pending Payment"
        | "Paid – In Production"
        | "Client Review"
        | "Closed – Delivered"
        | "Closed Lost"
      user_role: "sales" | "admin"
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
      lead_status: [
        "New Lead",
        "Contacted",
        "Follow-Up",
        "Meeting Scheduled",
        "Nurture",
        "Deal Confirmed – Pending Payment",
        "Paid – In Production",
        "Client Review",
        "Closed – Delivered",
        "Closed Lost",
      ],
      user_role: ["sales", "admin"],
    },
  },
} as const
