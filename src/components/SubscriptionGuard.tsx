'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { MessageCircle, ShieldAlert } from 'lucide-react'

// --- TU NÚMERO DE ADMINISTRADOR ---
const ADMIN_PHONE = "5493815990010" 

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()

useEffect(() => {
  const checkStatus = async () => {
    // 1. Forzamos a Supabase a traer los datos MÁS NUEVOS del servidor
    // (Esto ayuda a que no use datos viejos guardados en caché)
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      router.push('/login')
      return
    }

    // 2. Leemos el metadato (puede venir como true booleano o "true" texto)
    const approvedVal = user.user_metadata?.approved

    // 3. Verificamos ambas posibilidades
    const isApproved = approvedVal === true || approvedVal === "true"

    console.log("Estado de aprobación:", isApproved, "(Valor real:", approvedVal, ")") // Para depurar en consola

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

  // 2. NO AUTORIZADO (Pantalla de Bloqueo con WhatsApp)
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

          <div className="space-y-4">
            {/* BOTÓN WHATSAPP */}
            <Button asChild className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold gap-2 h-12 text-lg shadow-md transition-all hover:scale-[1.02]">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-6 w-6 fill-current" />
                Solicitar Alta por WhatsApp
              </a>
            </Button>
            
            <p className="text-xs text-slate-400 mt-4">
              Una vez autorizado, recarga esta página para ingresar.
            </p>
          </div>

        </div>
      </div>
    )
  }

  // 3. AUTORIZADO (Muestra el Dashboard)
  return <>{children}</>
}