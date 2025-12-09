import { createBrowserClient } from '@supabase/ssr'

// Usamos createBrowserClient en lugar de createClient directo
// Esto asegura que las cookies se manejen bien con el Middleware
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)