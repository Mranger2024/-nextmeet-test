export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string
          display_name: string | null
          gender: 'male' | 'female' | 'other' | null
          country: string | null
          created_at: string
          updated_at: string
          avatar_url?: string
        }
        Insert: {
          id: string
          email: string
          username: string
          display_name?: string | null
          gender?: 'male' | 'female' | 'other' | null
          country?: string | null
          created_at?: string
          updated_at?: string
          avatar_url?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          display_name?: string | null
          gender?: 'male' | 'female' | 'other' | null
          country?: string | null
          created_at?: string
          updated_at?: string
          avatar_url?: string
        }
      }
      friends: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: 'pending' | 'accepted' | 'blocked'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status: 'pending' | 'accepted' | 'blocked'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: 'pending' | 'accepted' | 'blocked'
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'friend_request' | 'room_invite' | 'message'
          content: string
          from_user_id: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'friend_request' | 'room_invite' | 'message'
          content: string
          from_user_id: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'friend_request' | 'room_invite' | 'message'
          content?: string
          from_user_id?: string
          read?: boolean
          created_at?: string
        }
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
  }
} 