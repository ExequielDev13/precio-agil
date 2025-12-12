'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { MessageCircle, ShieldAlert, LogOut } from 'lucide-react'

// --- TU NÚMERO DE ADMINISTRADOR ---
const ADMIN_PHONE = "5493815990010" 

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()

  // Función para cerrar sesión y forzar la actualización de permisos
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  useEffect(() => {
    const checkStatus = async () => {
      // Obtenemos los datos frescos del servidor
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/login')
        return
      }

      // Verificamos el metadato (acepta true booleano o "true" texto)
      const approvedVal = user.user_metadata?.approved
      const isApproved = approvedVal === true || approvedVal === "true"

      setIsAuthorized(isApproved)
      setLoading(false)
    }

    checkStatus()
  }, [router])

  // 1. Cargando...
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-slate-200 rounded-full"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  // 2. NO AUTORIZADO (Pantalla de Bloqueo)
  if (!isAuthorized) {
    
    const message = encodeURIComponent("Hola, solicito autorización para acceder a Nexostock.")
    const whatsappLink = `https://wa.me/${ADMIN_PHONE}?text=${message}`

    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg text-center border border-slate-100">
          
          <div className="mx-auto w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Acceso Restringido
          </h1>
          
          <p className="text-slate-600 mb-6">
            Tu cuenta ha sido creada correctamente, pero requiere 
            <strong className="text-slate-800"> autorización del administrador</strong> para acceder al sistema.
          </p>

          <div className="space-y-3">
            {/* BOTÓN WHATSAPP */}
            <Button asChild className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold gap-2 h-12 text-lg">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-6 w-6 fill-current" />
                Solicitar Alta por WhatsApp
              </a>
            </Button>
            
            {/* NUEVO BOTÓN: CERRAR SESIÓN (Para recargar permisos) */}
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="w-full gap-2 border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión (Recargar Permisos)
            </Button>
          </div>

        </div>
      </div>
    )
  }

  // 3. AUTORIZADO
  return <>{children}</>
}