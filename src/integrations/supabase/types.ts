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
  public: {
    Tables: {
      announcements: {
        Row: {
          body: string
          created_at: string
          id: string
          landlord_id: string
          property_id: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          landlord_id: string
          property_id: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          landlord_id?: string
          property_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      booking_requests: {
        Row: {
          created_at: string
          id: string
          landlord_id: string
          message: string | null
          move_in_date: string | null
          room_id: string
          status: Database["public"]["Enums"]["booking_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          landlord_id: string
          message?: string | null
          move_in_date?: string | null
          room_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          landlord_id?: string
          message?: string | null
          move_in_date?: string | null
          room_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          landlord_id: string
          room_id: string | null
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          landlord_id: string
          room_id?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          landlord_id?: string
          room_id?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          billing_cycle: string
          created_at: string
          deposit_amount: number
          end_date: string
          id: string
          landlord_id: string
          notes: string | null
          rent_amount: number
          room_id: string
          start_date: string
          status: Database["public"]["Enums"]["lease_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          created_at?: string
          deposit_amount?: number
          end_date: string
          id?: string
          landlord_id: string
          notes?: string | null
          rent_amount: number
          room_id: string
          start_date: string
          status?: Database["public"]["Enums"]["lease_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          deposit_amount?: number
          end_date?: string
          id?: string
          landlord_id?: string
          notes?: string | null
          rent_amount?: number
          room_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["lease_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leases_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_tickets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          landlord_id: string
          photos: string[] | null
          priority: Database["public"]["Enums"]["ticket_priority"]
          room_id: string
          status: Database["public"]["Enums"]["ticket_status"]
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          landlord_id: string
          photos?: string[] | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          room_id: string
          status?: Database["public"]["Enums"]["ticket_status"]
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          landlord_id?: string
          photos?: string[] | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          room_id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_tickets_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          lease_id: string
          method: string
          notes: string | null
          paid_on: string
          recorded_by: string | null
          reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          lease_id: string
          method?: string
          notes?: string | null
          paid_on?: string
          recorded_by?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          lease_id?: string
          method?: string
          notes?: string | null
          paid_on?: string
          recorded_by?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string | null
          id: string
          id_doc_url: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          id: string
          id_doc_url?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          id?: string
          id_doc_url?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          city: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          landlord_id: string
          name: string
          updated_at: string
        }
        Insert: {
          address: string
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          landlord_id: string
          name: string
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          landlord_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      room_labels: {
        Row: {
          color: string
          created_at: string
          id: string
          landlord_id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          landlord_id: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          landlord_id?: string
          name?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          amenities: string[] | null
          capacity: number
          created_at: string
          deposit: number
          description: string | null
          id: string
          is_listed: boolean
          label_id: string | null
          name: string
          photos: string[] | null
          price: number
          property_id: string
          status: Database["public"]["Enums"]["room_status"]
          updated_at: string
        }
        Insert: {
          amenities?: string[] | null
          capacity?: number
          created_at?: string
          deposit?: number
          description?: string | null
          id?: string
          is_listed?: boolean
          label_id?: string | null
          name: string
          photos?: string[] | null
          price?: number
          property_id: string
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Update: {
          amenities?: string[] | null
          capacity?: number
          created_at?: string
          deposit?: number
          description?: string | null
          id?: string
          is_listed?: boolean
          label_id?: string | null
          name?: string
          photos?: string[] | null
          price?: number
          property_id?: string
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "room_labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          ticket_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          ticket_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "maintenance_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: {
        Args: { _token: string }
        Returns: {
          invitation_id: string
          landlord_id: string
        }[]
      }
      expire_old_invitations: { Args: never; Returns: undefined }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_invitation_by_token: {
        Args: { _token: string }
        Returns: {
          email: string
          expires_at: string
          id: string
          landlord_id: string
          landlord_name: string
          property_name: string
          room_id: string
          room_name: string
          status: Database["public"]["Enums"]["invitation_status"]
        }[]
      }
      room_landlord: { Args: { _room_id: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "landlord" | "tenant"
      booking_status: "pending" | "approved" | "declined" | "cancelled"
      invitation_status: "pending" | "accepted" | "expired" | "revoked"
      lease_status: "pending" | "active" | "expiring" | "expired" | "terminated"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      room_status: "vacant" | "reserved" | "occupied" | "maintenance"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
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
      app_role: ["admin", "landlord", "tenant"],
      booking_status: ["pending", "approved", "declined", "cancelled"],
      invitation_status: ["pending", "accepted", "expired", "revoked"],
      lease_status: ["pending", "active", "expiring", "expired", "terminated"],
      payment_status: ["pending", "paid", "failed", "refunded"],
      room_status: ["vacant", "reserved", "occupied", "maintenance"],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const
