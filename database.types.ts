export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      announcements: {
        Row: {
          created_at: string
          id: number
          message: string
          sent_at: string
          sent_count: number | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: never
          message: string
          sent_at: string
          sent_count?: number | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: never
          message?: string
          sent_at?: string
          sent_count?: number | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          store_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_job_logs: {
        Row: {
          executed_at: string | null
          id: number
          job_name: string
          result: string | null
        }
        Insert: {
          executed_at?: string | null
          id?: number
          job_name: string
          result?: string | null
        }
        Update: {
          executed_at?: string | null
          id?: number
          job_name?: string
          result?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          auth_id: string | null
          city: string | null
          created_at: string | null
          email: string
          full_name: string | null
          homeaddress: string | null
          id: string
          ordernote: string | null
          phone: string | null
          status: string | null
          subscriptiondays: number | null
          subscriptionstart: string | null
          updated_at: string | null
          workaddress: string | null
        }
        Insert: {
          address?: string | null
          auth_id?: string | null
          city?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          homeaddress?: string | null
          id?: string
          ordernote?: string | null
          phone?: string | null
          status?: string | null
          subscriptiondays?: number | null
          subscriptionstart?: string | null
          updated_at?: string | null
          workaddress?: string | null
        }
        Update: {
          address?: string | null
          auth_id?: string | null
          city?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          homeaddress?: string | null
          id?: string
          ordernote?: string | null
          phone?: string | null
          status?: string | null
          subscriptiondays?: number | null
          subscriptionstart?: string | null
          updated_at?: string | null
          workaddress?: string | null
        }
        Relationships: []
      }
      driver_payments: {
        Row: {
          advance: number | null
          created_at: string
          driverid: string
          finalamount: number | null
          id: number
          paymentstatus: string | null
          penalty: number | null
          processed_orders: Json | null
          totalkm: string | null
          totalorders: number | null
        }
        Insert: {
          advance?: number | null
          created_at?: string
          driverid: string
          finalamount?: number | null
          id?: number
          paymentstatus?: string | null
          penalty?: number | null
          processed_orders?: Json | null
          totalkm?: string | null
          totalorders?: number | null
        }
        Update: {
          advance?: number | null
          created_at?: string
          driverid?: string
          finalamount?: number | null
          id?: number
          paymentstatus?: string | null
          penalty?: number | null
          processed_orders?: Json | null
          totalkm?: string | null
          totalorders?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_payments_driverid_fkey"
            columns: ["driverid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_sessions: {
        Row: {
          created_at: string | null
          duration: unknown | null
          end_time: string | null
          id: number
          start_time: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration?: unknown | null
          end_time?: string | null
          id?: never
          start_time?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration?: unknown | null
          end_time?: string | null
          id?: never
          start_time?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      managers: {
        Row: {
          aadhaar_number: string | null
          address: string | null
          alternate_phone: string | null
          auth_id: string | null
          bank_account_number: string | null
          base_salary: number | null
          created_at: string | null
          email: string
          emergency_contact: string | null
          full_name: string
          id: string
          is_active: boolean | null
          pan_number: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          aadhaar_number?: string | null
          address?: string | null
          alternate_phone?: string | null
          auth_id?: string | null
          bank_account_number?: string | null
          base_salary?: number | null
          created_at?: string | null
          email: string
          emergency_contact?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          pan_number?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          aadhaar_number?: string | null
          address?: string | null
          alternate_phone?: string | null
          auth_id?: string | null
          bank_account_number?: string | null
          base_salary?: number | null
          created_at?: string | null
          email?: string
          emergency_contact?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          pan_number?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_available: boolean | null
          name: string
          price: number
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          name: string
          price: number
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          name?: string
          price?: number
          store_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          delivery_attempted: boolean | null
          delivery_response: Json | null
          id: string
          is_read: boolean | null
          message: string
          recipient_id: string
          recipient_type: string | null
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_attempted?: boolean | null
          delivery_response?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          recipient_id: string
          recipient_type?: string | null
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_attempted?: boolean | null
          delivery_response?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          recipient_id?: string
          recipient_type?: string | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          menu_item_id: string | null
          order_id: string | null
          price_at_time: number
          quantity: number
          special_instructions: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          menu_item_id?: string | null
          order_id?: string | null
          price_at_time: number
          quantity: number
          special_instructions?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          menu_item_id?: string | null
          order_id?: string | null
          price_at_time?: number
          quantity?: number
          special_instructions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_transfers: {
        Row: {
          created_at: string | null
          from_driver_id: string | null
          id: string
          order_id: string | null
          reason: string
          to_driver_id: string | null
          transferred_by: string | null
        }
        Insert: {
          created_at?: string | null
          from_driver_id?: string | null
          id?: string
          order_id?: string | null
          reason: string
          to_driver_id?: string | null
          transferred_by?: string | null
        }
        Update: {
          created_at?: string | null
          from_driver_id?: string | null
          id?: string
          order_id?: string | null
          reason?: string
          to_driver_id?: string | null
          transferred_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_transfers_transferred_by_fkey"
            columns: ["transferred_by"]
            isOneToOne: false
            referencedRelation: "managers"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          completiontime: string | null
          created_at: string
          customerid: string | null
          customername: string | null
          delivery_notes: string | null
          delivery_sequence: number | null
          destination: string | null
          distance: string | null
          driveremail: string | null
          driverid: string | null
          drivername: string | null
          id: number
          managernumber: string | null
          payment_method: string | null
          payment_processed: string | null
          payment_status: string | null
          photo_proof: string | null
          remark: string | null
          start: string | null
          status: string | null
          storeid: string | null
          time: string | null
          total_amount: number | null
        }
        Insert: {
          completiontime?: string | null
          created_at?: string
          customerid?: string | null
          customername?: string | null
          delivery_notes?: string | null
          delivery_sequence?: number | null
          destination?: string | null
          distance?: string | null
          driveremail?: string | null
          driverid?: string | null
          drivername?: string | null
          id?: number
          managernumber?: string | null
          payment_method?: string | null
          payment_processed?: string | null
          payment_status?: string | null
          photo_proof?: string | null
          remark?: string | null
          start?: string | null
          status?: string | null
          storeid?: string | null
          time?: string | null
          total_amount?: number | null
        }
        Update: {
          completiontime?: string | null
          created_at?: string
          customerid?: string | null
          customername?: string | null
          delivery_notes?: string | null
          delivery_sequence?: number | null
          destination?: string | null
          distance?: string | null
          driveremail?: string | null
          driverid?: string | null
          drivername?: string | null
          id?: number
          managernumber?: string | null
          payment_method?: string | null
          payment_processed?: string | null
          payment_status?: string | null
          photo_proof?: string | null
          remark?: string | null
          start?: string | null
          status?: string | null
          storeid?: string | null
          time?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_orders_driver"
            columns: ["driverid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customerid_fkey"
            columns: ["customerid"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_storeid_fkey"
            columns: ["storeid"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      penalties: {
        Row: {
          amount: number
          appeal_deadline: string | null
          appeal_reason: string | null
          appeal_status: string | null
          can_appeal: boolean | null
          created_at: string | null
          created_by: string | null
          driver_id: string | null
          driver_response: string | null
          evidence_url: string | null
          id: string
          order_id: number | null
          predefined_reason_id: string | null
          reason: string
          reason_type: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          appeal_deadline?: string | null
          appeal_reason?: string | null
          appeal_status?: string | null
          can_appeal?: boolean | null
          created_at?: string | null
          created_by?: string | null
          driver_id?: string | null
          driver_response?: string | null
          evidence_url?: string | null
          id?: string
          order_id?: number | null
          predefined_reason_id?: string | null
          reason: string
          reason_type?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          appeal_deadline?: string | null
          appeal_reason?: string | null
          appeal_status?: string | null
          can_appeal?: boolean | null
          created_at?: string | null
          created_by?: string | null
          driver_id?: string | null
          driver_response?: string | null
          evidence_url?: string | null
          id?: string
          order_id?: number | null
          predefined_reason_id?: string | null
          reason?: string
          reason_type?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "penalties_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalties_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalties_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalties_predefined_reason_id_fkey"
            columns: ["predefined_reason_id"]
            isOneToOne: false
            referencedRelation: "penalty_reasons"
            referencedColumns: ["id"]
          },
        ]
      }
      penalty_reasons: {
        Row: {
          created_at: string | null
          default_amount: number | null
          description: string | null
          id: string
          is_active: boolean | null
          reason: string
        }
        Insert: {
          created_at?: string | null
          default_amount?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          reason: string
        }
        Update: {
          created_at?: string | null
          default_amount?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          address: string
          closing_time: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          opening_time: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address: string
          closing_time?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          opening_time?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          closing_time?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          opening_time?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_reviews: {
        Row: {
          badges: string[] | null
          comment: string | null
          created_at: string | null
          customer_id: string | null
          id: number
          order_id: number
          rating: number
          restaurant_name: string
          store_id: string | null
          user_id: string | null
        }
        Insert: {
          badges?: string[] | null
          comment?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: never
          order_id: number
          rating: number
          restaurant_name: string
          store_id?: string | null
          user_id?: string | null
        }
        Update: {
          badges?: string[] | null
          comment?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: never
          order_id?: number
          rating?: number
          restaurant_name?: string
          store_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          aadhar_no: string | null
          about_driver: string | null
          address: string | null
          age: string | null
          alternate_phone: string | null
          auth_id: string | null
          bank_account_no: string | null
          bank_ifsc_code: string | null
          bank_name: string | null
          city: string | null
          created_at: string | null
          driving_license: string | null
          email: string
          full_name: string | null
          home_phone_number: string | null
          homeaddress: string | null
          id: string
          insurance_expiry: string | null
          insurance_number: string | null
          is_active: boolean | null
          license_expiry: string | null
          location: string | null
          manager: boolean | null
          ordernote: string | null
          pan_card_number: string | null
          phone: string | null
          photo: string | null
          status: string | null
          subscriptiondays: number | null
          subscriptionstart: string | null
          updated_at: string | null
          upi_id: string | null
          vehicle_color: string | null
          vehicle_model: string | null
          vehicle_number: string | null
          vehicle_type: string | null
          vehicle_year: string | null
          workaddress: string | null
        }
        Insert: {
          aadhar_no?: string | null
          about_driver?: string | null
          address?: string | null
          age?: string | null
          alternate_phone?: string | null
          auth_id?: string | null
          bank_account_no?: string | null
          bank_ifsc_code?: string | null
          bank_name?: string | null
          city?: string | null
          created_at?: string | null
          driving_license?: string | null
          email: string
          full_name?: string | null
          home_phone_number?: string | null
          homeaddress?: string | null
          id?: string
          insurance_expiry?: string | null
          insurance_number?: string | null
          is_active?: boolean | null
          license_expiry?: string | null
          location?: string | null
          manager?: boolean | null
          ordernote?: string | null
          pan_card_number?: string | null
          phone?: string | null
          photo?: string | null
          status?: string | null
          subscriptiondays?: number | null
          subscriptionstart?: string | null
          updated_at?: string | null
          upi_id?: string | null
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_number?: string | null
          vehicle_type?: string | null
          vehicle_year?: string | null
          workaddress?: string | null
        }
        Update: {
          aadhar_no?: string | null
          about_driver?: string | null
          address?: string | null
          age?: string | null
          alternate_phone?: string | null
          auth_id?: string | null
          bank_account_no?: string | null
          bank_ifsc_code?: string | null
          bank_name?: string | null
          city?: string | null
          created_at?: string | null
          driving_license?: string | null
          email?: string
          full_name?: string | null
          home_phone_number?: string | null
          homeaddress?: string | null
          id?: string
          insurance_expiry?: string | null
          insurance_number?: string | null
          is_active?: boolean | null
          license_expiry?: string | null
          location?: string | null
          manager?: boolean | null
          ordernote?: string | null
          pan_card_number?: string | null
          phone?: string | null
          photo?: string | null
          status?: string | null
          subscriptiondays?: number | null
          subscriptionstart?: string | null
          updated_at?: string | null
          upi_id?: string | null
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_number?: string | null
          vehicle_type?: string | null
          vehicle_year?: string | null
          workaddress?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      audit_log_entries: {
        Row: {
          created_at: string | null
          id: string | null
          instance_id: string | null
          ip_address: string | null
          payload: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          instance_id?: string | null
          ip_address?: string | null
          payload?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          instance_id?: string | null
          ip_address?: string | null
          payload?: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      call_driver_mode_off_api: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_sessions_for_user: {
        Args: {
          user_id_input: string
          time_filter: string
        }
        Returns: unknown[]
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
