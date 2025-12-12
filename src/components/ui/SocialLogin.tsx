'use client'

import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Chrome, Mail } from 'lucide-react' 
import { toast } from "sonner"

export function SocialLogin() {

  const handleLogin = async (provider: 'google' | 'azure') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          // --- AQUÍ ESTÁ EL CAMBIO CLAVE ---
          // Antes: ibas directo a /dashboard
          // Ahora: vas a /auth/callback y le pasas el parámetro ?next=/dashboard
          redirectTo: `${location.origin}/auth/callback?next=/dashboard`,
          
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) throw error
      
    } catch (error: any) {
      toast.error("Error al iniciar sesión: " + error.message)
    }
  }

  return (
    <div className="grid gap-3">
      <Button 
        variant="outline" 
        onClick={() => handleLogin('google')}
        className="w-full flex items-center gap-2 bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
      >
        <Chrome className="h-4 w-4 text-red-500" />
        Continuar con Google
      </Button>

      <Button 
        variant="outline" 
        onClick={() => handleLogin('azure')}
        className="w-full flex items-center gap-2 bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
      >
        <Mail className="h-4 w-4 text-blue-600" />
        Continuar con Outlook
      </Button>
    </div>
  )
}