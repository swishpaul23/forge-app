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
      challenge_tasks: {
        Row: {
          cat: string | null
          challenge_id: string
          created_at: string | null
          id: string
          key: string
          label: string
          non_neg: boolean | null
          sort_order: number | null
          weight: number | null
        }
        Insert: {
          cat?: string | null
          challenge_id: string
          created_at?: string | null
          id?: string
          key: string
          label: string
          non_neg?: boolean | null
          sort_order?: number | null
          weight?: number | null
        }
        Update: {
          cat?: string | null
          challenge_id?: string
          created_at?: string | null
          id?: string
          key?: string
          label?: string
          non_neg?: boolean | null
          sort_order?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_tasks_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          archived: boolean | null
          color: string | null
          completed_at: string | null
          consistency: number | null
          created_at: string | null
          id: string
          is_main: boolean | null
          mission: string | null
          name: string
          start_date: string | null
          streak: number | null
          tag: string | null
          total_days: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          archived?: boolean | null
          color?: string | null
          completed_at?: string | null
          consistency?: number | null
          created_at?: string | null
          id?: string
          is_main?: boolean | null
          mission?: string | null
          name: string
          start_date?: string | null
          streak?: number | null
          tag?: string | null
          total_days: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          archived?: boolean | null
          color?: string | null
          completed_at?: string | null
          consistency?: number | null
          created_at?: string | null
          id?: string
          is_main?: boolean | null
          mission?: string | null
          name?: string
          start_date?: string | null
          streak?: number | null
          tag?: string | null
          total_days?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      checkins: {
        Row: {
          challenge_id: string
          completed_keys: Json | null
          date: string
          day_mode: string | null
          id: string
          score: number | null
          updated_at: string | null
        }
        Insert: {
          challenge_id: string
          completed_keys?: Json | null
          date: string
          day_mode?: string | null
          id?: string
          score?: number | null
          updated_at?: string | null
        }
        Update: {
          challenge_id?: string
          completed_keys?: Json | null
          date?: string
          day_mode?: string | null
          id?: string
          score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkins_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          body: string
          created_at: string | null
          id: string
          type: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          type: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          challenge_id: string | null
          created_at: string | null
          cycles: number | null
          duration_seconds: number
          id: string
          tasks_completed: number | null
          user_id: string | null
        }
        Insert: {
          challenge_id?: string | null
          created_at?: string | null
          cycles?: number | null
          duration_seconds: number
          id?: string
          tasks_completed?: number | null
          user_id?: string | null
        }
        Update: {
          challenge_id?: string | null
          created_at?: string | null
          cycles?: number | null
          duration_seconds?: number
          id?: string
          tasks_completed?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_prefs: {
        Row: {
          checkin_hours: number[] | null
          daily_reminder: boolean | null
          enabled: boolean | null
          manual_hour: number | null
          manual_minute: number | null
          milestone_alerts: boolean | null
          milestones_sent: string[] | null
          nudge_alerts: boolean | null
          timing_mode: string | null
          user_id: string
        }
        Insert: {
          checkin_hours?: number[] | null
          daily_reminder?: boolean | null
          enabled?: boolean | null
          manual_hour?: number | null
          manual_minute?: number | null
          milestone_alerts?: boolean | null
          milestones_sent?: string[] | null
          nudge_alerts?: boolean | null
          timing_mode?: string | null
          user_id: string
        }
        Update: {
          checkin_hours?: number[] | null
          daily_reminder?: boolean | null
          enabled?: boolean | null
          manual_hour?: number | null
          manual_minute?: number | null
          milestone_alerts?: boolean | null
          milestones_sent?: string[] | null
          nudge_alerts?: boolean | null
          timing_mode?: string | null
          user_id?: string
        }
        Relationships: []
      }
      partner_messages: {
        Row: {
          body: string
          created_at: string | null
          from_user_id: string
          id: string
          read: boolean | null
          to_user_id: string
          type: string
        }
        Insert: {
          body: string
          created_at?: string | null
          from_user_id: string
          id?: string
          read?: boolean | null
          to_user_id: string
          type?: string
        }
        Update: {
          body?: string
          created_at?: string | null
          from_user_id?: string
          id?: string
          read?: boolean | null
          to_user_id?: string
          type?: string
        }
        Relationships: []
      }
      partner_notes: {
        Row: {
          body: string
          created_at: string | null
          expires_at: string | null
          from_user_id: string | null
          id: string
          partnership_id: string | null
          to_user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          expires_at?: string | null
          from_user_id?: string | null
          id?: string
          partnership_id?: string | null
          to_user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          expires_at?: string | null
          from_user_id?: string | null
          id?: string
          partnership_id?: string | null
          to_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_notes_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          from_user_id: string
          id: string
          to_user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          from_user_id: string
          id?: string
          to_user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          from_user_id?: string
          id?: string
          to_user_id?: string
        }
        Relationships: []
      }
      partnerships: {
        Row: {
          created_at: string | null
          id: string
          invite_code: string
          partner_id: string
          protocol: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invite_code: string
          partner_id: string
          protocol?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invite_code?: string
          partner_id?: string
          protocol?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          invite_code: string | null
          mission: string | null
          momentum: number | null
          onboarded: boolean | null
          partner_tutorial_seen: boolean | null
          theme: string | null
          tone: string | null
          tutorial_done: boolean | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          invite_code?: string | null
          mission?: string | null
          momentum?: number | null
          onboarded?: boolean | null
          partner_tutorial_seen?: boolean | null
          theme?: string | null
          tone?: string | null
          tutorial_done?: boolean | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          invite_code?: string | null
          mission?: string | null
          momentum?: number | null
          onboarded?: boolean | null
          partner_tutorial_seen?: boolean | null
          theme?: string | null
          tone?: string | null
          tutorial_done?: boolean | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          platform: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          platform?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          platform?: string | null
          user_id?: string
        }
        Relationships: []
      }
      regimen_logs: {
        Row: {
          completed_ids: string[]
          created_at: string | null
          date: string
          id: string
          user_id: string | null
        }
        Insert: {
          completed_ids?: string[]
          created_at?: string | null
          date: string
          id?: string
          user_id?: string | null
        }
        Update: {
          completed_ids?: string[]
          created_at?: string | null
          date?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regimen_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      time_blocks: {
        Row: {
          completed: boolean | null
          created_at: string | null
          date: string
          duration: number
          id: string
          is_regimen: boolean | null
          label: string
          start_time: number
          tag_id: string | null
          task_key: string | null
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          date: string
          duration?: number
          id?: string
          is_regimen?: boolean | null
          label: string
          start_time: number
          tag_id?: string | null
          task_key?: string | null
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          date?: string
          duration?: number
          id?: string
          is_regimen?: boolean | null
          label?: string
          start_time?: number
          tag_id?: string | null
          task_key?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_blocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tags: {
        Row: {
          color: string
          id: string
          is_system: boolean | null
          label: string
          user_id: string
        }
        Insert: {
          color: string
          id: string
          is_system?: boolean | null
          label: string
          user_id: string
        }
        Update: {
          color?: string
          id?: string
          is_system?: boolean | null
          label?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
