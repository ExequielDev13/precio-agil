import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Si en el paso 1 pusimos "?next=/dashboard", aquí lo recuperamos.
  // Si no viene nada, por defecto va a /dashboard.
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = {
        getAll() {
            return request.cookies.getAll()
        },
        setAll(cookiesToSet: any[]) {
            cookiesToSet.forEach(({ name, value, options }) => 
                request.cookies.set(name, value)
            )
        },
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: cookieStore,
      }
    )
    
    // El intercambio mágico: Código -> Sesión
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Si todo salió bien, redirigimos al usuario a donde quería ir (Dashboard)
      // Usamos redirect de NextResponse para asegurar que las cookies viajen
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si falla, al login
  return NextResponse.redirect(`${origin}/login?error=auth`)
}