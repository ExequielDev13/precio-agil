'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { MessageCircle, ShieldAlert, LogOut, Bug } from 'lucide-react'

const ADMIN_PHONE = "5493815990010" 

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  
  // VARIABLE DE DEBUG PARA VER EN PANTALLA
  const [debugData, setDebugData] = useState<any>(null)
  
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/login')
        return
      }

      // Guardamos los datos para mostrarlos en pantalla (Modo Detective)
      setDebugData(user.user_metadata)

      // Verificamos el metadato
      const approvedVal = user.user_metadata?.approved
      // Aceptamos true (booleano) o "true" (texto)
      const isApproved = approvedVal === true || approvedVal === "true"

      setIsAuthorized(isApproved)
      setLoading(false)
    }

    checkStatus()
  }, [router])

  if (loading) {
    return <div className="p-10 text-center">Cargando permisos...</div>
  }

  if (!isAuthorized) {
    const message = encodeURIComponent("Hola, solicito autorización para acceder a Nexostock.")
    const whatsappLink = `https://wa.me/${ADMIN_PHONE}?text=${message}`

    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg text-center border border-slate-100">
          
          <div className="mx-auto w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <h1 className="text-2xl font-bold text-slate-800 mb-2">Acceso Restringido</h1>
          <p className="text-slate-600 mb-6">Requiere autorización del administrador.</p>

          <div className="space-y-3">
            <Button asChild className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold gap-2 h-12">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-6 w-6 fill-current" />
                Solicitar Alta
              </a>
            </Button>
            
            <Button onClick={handleLogout} variant="outline" className="w-full gap-2">
              <LogOut className="h-4 w-4" /> Cerrar Sesión
            </Button>
          </div>

          {/* --- ZONA DE DIAGNÓSTICO (ESTO TE DIRÁ EL PROBLEMA) --- */}
          <div className="mt-8 p-4 bg-slate-100 rounded text-left text-xs font-mono border border-slate-200 overflow-auto max-h-40">
            <p className="font-bold text-red-600 mb-2 flex items-center gap-2">
                <Bug className="h-3 w-3"/> DATOS QUE VE EL SISTEMA:
            </p>
            <pre>{JSON.stringify(debugData, null, 2)}</pre>
          </div>
          {/* ----------------------------------------------------- */}

        </div>
      </div>
    )
  }

  return <>{children}</>
}