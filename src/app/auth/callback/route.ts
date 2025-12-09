import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // si viene "next", usamos eso para redirigir, si no, al dashboard
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
    
    // Intercambiamos el código por una sesión real
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si algo falla, volvemos al login con error
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}