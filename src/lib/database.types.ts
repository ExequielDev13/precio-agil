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
          email: string | null
          business_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          business_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          business_name?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          user_id: string
          name: string
          sku: string | null
          sale_price: number
          cost_price: number | null
          stock: number
          category_id: string | null
          price_list_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          sku?: string | null
          sale_price: number
          cost_price?: number | null
          stock?: number
          category_id?: string | null
          price_list_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          sku?: string | null
          sale_price?: number
          cost_price?: number | null
          stock?: number
          category_id?: string | null
          price_list_id?: string | null
          created_at?: string
        }
      }
      // Agregaremos más tipos si los necesitamos, por ahora estos son los vitales.
    }
  }
}