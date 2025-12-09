'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ShieldAlert, CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'active' | 'pending' | 'expired'>('pending')
  const [expiryDate, setExpiryDate] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !profile) {
        setStatus('pending')
        setLoading(false)
        return
      }

      setExpiryDate(profile.subscription_ends_at)

      if (!profile.is_active) {
        setStatus('pending')
      } 
      else if (new Date(profile.subscription_ends_at) < new Date()) {
        setStatus('expired')
      } 
      else {
        setStatus('active')
      }
      setLoading(false)
    }

    checkSubscription()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // TU NÚMERO DE WHATSAPP
  // Formato internacional sin símbolos (+): 549381... o 54381...
  const whatsappNumber = "543815990010"
  const message = "Hola, mi suscripción ha vencido y quiero renovarla para seguir usando PrecioÁgil."

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md border border-slate-200">
          <div className="bg-blue-100 p-4 rounded-full w-fit mx-auto mb-4">
            <ShieldAlert className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Cuenta en Revisión</h2>
          <p className="text-slate-500 mb-6">
            Gracias por registrarte. Estamos verificando tu solicitud. 
            <br/>Te contactaremos para activar tu licencia.
          </p>
          <Button onClick={handleLogout} variant="outline">Cerrar Sesión</Button>
        </div>
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md border border-red-100">
          <div className="bg-red-100 p-4 rounded-full w-fit mx-auto mb-4">
            <CalendarClock className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Suscripción Vencida</h2>
          <p className="text-slate-500 mb-2">
            Tu licencia expiró el: <b>{new Date(expiryDate!).toLocaleDateString()}</b>
          </p>
          <p className="text-sm text-slate-400 mb-6">
            Tus datos están seguros, pero necesitas renovar para acceder.
          </p>
          
          <div className="space-y-3">
             {/* BOTÓN DE WHATSAPP CONFIGURADO CON TU NÚMERO */}
             <Button 
               className="w-full bg-green-600 hover:bg-green-700 text-white font-bold" 
               onClick={() => window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank')}
             >
               Renovar por WhatsApp
             </Button>
             
             <Button onClick={handleLogout} variant="ghost" className="text-slate-500">
               Cerrar Sesión
             </Button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}