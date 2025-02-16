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
      users: {
        Row: {
          id: string
          username: string
          display_name: string
          gender: 'male' | 'female' | 'other'
          country: string
          is_online: boolean
          last_seen: string
          created_at: string
        }
        Insert: {
          id: string
          username: string
          display_name: string
          gender: 'male' | 'female' | 'other'
          country: string
          is_online?: boolean
          last_seen?: string
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string
          gender?: 'male' | 'female' | 'other'
          country?: string
          is_online?: boolean
          last_seen?: string
          created_at?: string
        }
      }
      friends: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: 'pending' | 'accepted'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status: 'pending' | 'accepted'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: 'pending' | 'accepted'
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
      rooms: {
        Row: {
          id: string
          name: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string
          created_at?: string
        }
      }
      room_members: {
        Row: {
          id: string
          room_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
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