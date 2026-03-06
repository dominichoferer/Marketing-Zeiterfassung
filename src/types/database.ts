export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          staff_name: string | null;
          staff_code: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          staff_name?: string | null;
          staff_code?: string | null;
          created_at?: string;
        };
        Update: {
          staff_name?: string | null;
          staff_code?: string | null;
        };
      };
      time_entries: {
        Row: {
          id: string;
          user_id: string;
          staff_name: string;
          staff_code: string;
          company_id: string;
          description: string;
          duration_minutes: number;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          staff_name: string;
          staff_code: string;
          company_id: string;
          description: string;
          duration_minutes: number;
          date?: string;
          created_at?: string;
        };
        Update: {
          company_id?: string;
          description?: string;
          duration_minutes?: number;
          date?: string;
        };
      };
    };
  };
};

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type TimeEntry = Database['public']['Tables']['time_entries']['Row'];
export type TimeEntryInsert = Database['public']['Tables']['time_entries']['Insert'];
