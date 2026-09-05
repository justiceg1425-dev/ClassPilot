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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string
          ends_on: string
          id: string
          name: string
          school_id: string
          starts_on: string
        }
        Insert: {
          created_at?: string
          ends_on: string
          id?: string
          name: string
          school_id: string
          starts_on: string
        }
        Update: {
          created_at?: string
          ends_on?: string
          id?: string
          name?: string
          school_id?: string
          starts_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          class_id: string
          created_at: string
          id: string
          on_date: string
          scale_id: string
          subject_id: string | null
          term_id: string | null
          title: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          on_date: string
          scale_id: string
          subject_id?: string | null
          term_id?: string | null
          title: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          on_date?: string
          scale_id?: string
          subject_id?: string | null
          term_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_scale_id_fkey"
            columns: ["scale_id"]
            isOneToOne: false
            referencedRelation: "grading_scales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year_id: string
          archived: boolean
          created_at: string
          day_ends_at: string
          day_starts_at: string
          default_scale_id: string | null
          id: string
          name: string
          school_id: string
          teaching_days: number[]
        }
        Insert: {
          academic_year_id: string
          archived?: boolean
          created_at?: string
          day_ends_at?: string
          day_starts_at?: string
          default_scale_id?: string | null
          id?: string
          name: string
          school_id: string
          teaching_days?: number[]
        }
        Update: {
          academic_year_id?: string
          archived?: boolean
          created_at?: string
          day_ends_at?: string
          day_starts_at?: string
          default_scale_id?: string | null
          id?: string
          name?: string
          school_id?: string
          teaching_days?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "classes_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_default_scale_fk"
            columns: ["default_scale_id"]
            isOneToOne: false
            referencedRelation: "grading_scales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_groups: {
        Row: {
          class_id: string
          grade_level: string
          id: string
          label: string
          sequence: number
        }
        Insert: {
          class_id: string
          grade_level: string
          id?: string
          label: string
          sequence?: number
        }
        Update: {
          class_id?: string
          grade_level?: string
          id?: string
          label?: string
          sequence?: number
        }
        Relationships: [
          {
            foreignKeyName: "grade_groups_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          absent: boolean
          assessment_id: string
          comment: string | null
          exempt: boolean
          id: string
          level_code: string | null
          numeric_value: number | null
          student_id: string
          updated_at: string
        }
        Insert: {
          absent?: boolean
          assessment_id: string
          comment?: string | null
          exempt?: boolean
          id?: string
          level_code?: string | null
          numeric_value?: number | null
          student_id: string
          updated_at?: string
        }
        Update: {
          absent?: boolean
          assessment_id?: string
          comment?: string | null
          exempt?: boolean
          id?: string
          level_code?: string | null
          numeric_value?: number | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_scales: {
        Row: {
          class_id: string
          id: string
          kind: string
          levels: Json | null
          max_value: number | null
          name: string
        }
        Insert: {
          class_id: string
          id?: string
          kind: string
          levels?: Json | null
          max_value?: number | null
          name: string
        }
        Update: {
          class_id?: string
          id?: string
          kind?: string
          levels?: Json | null
          max_value?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "grading_scales_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      non_teaching_periods: {
        Row: {
          academic_year_id: string
          ends_on: string
          id: string
          label: string
          starts_on: string
        }
        Insert: {
          academic_year_id: string
          ends_on: string
          id?: string
          label: string
          starts_on: string
        }
        Update: {
          academic_year_id?: string
          ends_on?: string
          id?: string
          label?: string
          starts_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "non_teaching_periods_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          plan_tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
          plan_tier?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          plan_tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      schools: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schools_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          class_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          grade_group_id: string | null
          id: string
          notes: string | null
          objective: string | null
          on_date: string
          origin: string
          slot_id: string | null
          start_time: string
          status: string
          subject_id: string | null
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          description?: string | null
          duration_minutes: number
          grade_group_id?: string | null
          id?: string
          notes?: string | null
          objective?: string | null
          on_date: string
          origin?: string
          slot_id?: string | null
          start_time: string
          status?: string
          subject_id?: string | null
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          grade_group_id?: string | null
          id?: string
          notes?: string | null
          objective?: string | null
          on_date?: string
          origin?: string
          slot_id?: string | null
          start_time?: string
          status?: string
          subject_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_grade_group_id_fkey"
            columns: ["grade_group_id"]
            isOneToOne: false
            referencedRelation: "grade_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "timetable_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_group_members: {
        Row: {
          group_id: string
          student_id: string
        }
        Insert: {
          group_id: string
          student_id: string
        }
        Update: {
          group_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_group_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_groups: {
        Row: {
          class_id: string
          id: string
          name: string
          purpose: string | null
        }
        Insert: {
          class_id: string
          id?: string
          name: string
          purpose?: string | null
        }
        Update: {
          class_id?: string
          id?: string
          name?: string
          purpose?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_groups_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          active: boolean
          class_id: string
          created_at: string
          date_of_birth: string | null
          first_name: string
          grade_group_id: string | null
          id: string
          last_name: string
          notes: string | null
          photo_path: string | null
          support_flag: boolean
        }
        Insert: {
          active?: boolean
          class_id: string
          created_at?: string
          date_of_birth?: string | null
          first_name: string
          grade_group_id?: string | null
          id?: string
          last_name: string
          notes?: string | null
          photo_path?: string | null
          support_flag?: boolean
        }
        Update: {
          active?: boolean
          class_id?: string
          created_at?: string
          date_of_birth?: string | null
          first_name?: string
          grade_group_id?: string | null
          id?: string
          last_name?: string
          notes?: string | null
          photo_path?: string | null
          support_flag?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_grade_group_id_fkey"
            columns: ["grade_group_id"]
            isOneToOne: false
            referencedRelation: "grade_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          active: boolean
          class_id: string
          colour: string
          id: string
          name: string
          short_label: string
        }
        Insert: {
          active?: boolean
          class_id: string
          colour?: string
          id?: string
          name: string
          short_label: string
        }
        Update: {
          active?: boolean
          class_id?: string
          colour?: string
          id?: string
          name?: string
          short_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      terms: {
        Row: {
          academic_year_id: string
          ends_on: string
          id: string
          name: string
          sequence: number
          starts_on: string
        }
        Insert: {
          academic_year_id: string
          ends_on: string
          id?: string
          name: string
          sequence: number
          starts_on: string
        }
        Update: {
          academic_year_id?: string
          ends_on?: string
          id?: string
          name?: string
          sequence?: number
          starts_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "terms_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_slots: {
        Row: {
          class_id: string
          created_at: string
          day_of_week: number
          duration_minutes: number
          end_time: string | null
          grade_group_id: string | null
          id: string
          start_time: string
          subject_id: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          class_id: string
          created_at?: string
          day_of_week: number
          duration_minutes: number
          end_time?: string | null
          grade_group_id?: string | null
          id?: string
          start_time: string
          subject_id: string
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string
          day_of_week?: number
          duration_minutes?: number
          end_time?: string | null
          grade_group_id?: string | null
          id?: string
          start_time?: string
          subject_id?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetable_slots_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_grade_group_id_fkey"
            columns: ["grade_group_id"]
            isOneToOne: false
            referencedRelation: "grade_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      app_owns_class: { Args: { p_class_id: string }; Returns: boolean }
      timemultirange: { Args: never; Returns: unknown }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
