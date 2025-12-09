'use client'

import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Chrome, Mail } from 'lucide-react' // Usamos Chrome como icono de Google y Mail para Outlook
import { toast } from "sonner"

export function SocialLogin() {

  const handleLogin = async (provider: 'google' | 'azure') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          // A dónde redirigir al usuario después de loguearse
          redirectTo: `${location.origin}/dashboard`, // O la ruta que quieras
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) throw error
      
      // Nota: OAuth redirige al usuario fuera de tu página, 
      // así que este toast quizás no se llegue a ver, pero es buena práctica.
    } catch (error: any) {
      toast.error("Error al iniciar sesión: " + error.message)
    }
  }

  return (
    <div className="grid gap-3">
      {/* Botón de Google */}
      <Button 
        variant="outline" 
        onClick={() => handleLogin('google')}
        className="w-full flex items-center gap-2 bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
      >
        <Chrome className="h-4 w-4 text-red-500" /> {/* Icono simulando Google */}
        Continuar con Google
      </Button>

      {/* Botón de Microsoft (Outlook/Hotmail) */}
      <Button 
        variant="outline" 
        onClick={() => handleLogin('azure')}
        className="w-full flex items-center gap-2 bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
      >
        <Mail className="h-4 w-4 text-blue-600" /> {/* Icono simulando Outlook */}
        Continuar con Outlook
      </Button>
    </div>
  )
}