'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { MessageCircle, ShieldAlert, LogOut, CalendarX } from 'lucide-react'

const ADMIN_PHONE = "5493815990010" 

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'ok' | 'blocked' | 'expired'>('ok') // Nuevo estado para expirado
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) { router.push('/login'); return }

      const meta = user.user_metadata || {}

      // 1. Verificar Aprobación
      const isApproved = meta.approved === true || meta.approved === "true"
      
      // 2. Verificar Vencimiento
      let isExpired = false
      if (meta.license_expiry) {
        const expiryDate = new Date(meta.license_expiry)
        const today = new Date()
        // Comparar fechas (reseteando horas para ser justos)
        expiryDate.setHours(23, 59, 59)
        if (today > expiryDate) {
            isExpired = true
        }
      }

      // Determinar estado final
      if (!isApproved) setStatus('blocked')
      else if (isExpired) setStatus('expired')
      else setStatus('ok')

      setLoading(false)
    }
    checkStatus()
  }, [router])

  if (loading) return <div className="h-screen flex items-center justify-center">Cargando...</div>

  // PANTALLA: LICENCIA VENCIDA
  if (status === 'expired') {
    const message = encodeURIComponent("Hola, mi licencia de Nexostock ha vencido. Quiero renovarla.")
    const whatsappLink = `https://wa.me/${ADMIN_PHONE}?text=${message}`

    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg text-center border border-slate-100">
          <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
            <CalendarX className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Licencia Vencida</h1>
          <p className="text-slate-600 mb-6">Tu período de suscripción ha finalizado. Por favor, contacta al administrador para renovar tu acceso.</p>
          <div className="space-y-3">
            <Button asChild className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold gap-2 h-12">
              <a href={whatsappLink} target="_blank"> <MessageCircle className="h-6 w-6 fill-current" /> Renovar Licencia </a>
            </Button>
            <Button onClick={handleLogout} variant="outline" className="w-full gap-2"><LogOut className="h-4 w-4" /> Cerrar Sesión</Button>
          </div>
        </div>
      </div>
    )
  }

  // PANTALLA: BLOQUEADO (NO AUTORIZADO)
  if (status === 'blocked') {
     // ... (El código anterior de bloqueo, igual que antes) ...
     const message = encodeURIComponent("Hola, solicito autorización para acceder a Nexostock.")
     const whatsappLink = `https://wa.me/${ADMIN_PHONE}?text=${message}`
     return (
        <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg text-center border border-slate-100">
            <div className="mx-auto w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-4">
                <ShieldAlert className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Acceso Restringido</h1>
            <p className="text-slate-600 mb-6">Tu cuenta requiere autorización del administrador.</p>
            <div className="space-y-3">
                <Button asChild className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold gap-2 h-12">
                <a href={whatsappLink} target="_blank"><MessageCircle className="h-6 w-6 fill-current" /> Solicitar Alta</a>
                </Button>
                <Button onClick={handleLogout} variant="outline" className="w-full gap-2"><LogOut className="h-4 w-4" /> Cerrar Sesión</Button>
            </div>
            </div>
        </div>
     )
  }

  return <>{children}</>
}