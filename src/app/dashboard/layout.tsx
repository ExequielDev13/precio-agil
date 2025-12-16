'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { UserProfile } from "@/components/ui/UserProfile"
import { Menu, X, Loader2, AlertTriangle, ExternalLink } from 'lucide-react' // <--- ICONOS NUEVOS
import { Button } from "@/components/ui/button"
import { OnboardingModal } from '@/components/ui/OnboardingModal'
import { SubscriptionGuard } from "@/components/SubscriptionGuard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert" // <--- ALERTAS

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  
  // Estados
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [modules, setModules] = useState<any>({})
  const [loading, setLoading] = useState(true)
  
  // NUEVO ESTADO: Alerta de vencimiento próximo
  const [expirationAlert, setExpirationAlert] = useState<{ show: boolean; days: number } | null>(null)

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          router.replace('/login')
          return
        }

        const metadata = session.user.user_metadata

        // --- VERIFICACIÓN DE LICENCIA ---
        if (metadata?.license_end) {
            const today = new Date()
            today.setHours(0, 0, 0, 0) // Normalizamos a medianoche
            
            const licenseDate = new Date(`${metadata.license_end}T24:00:00`)
            
            // Calculamos la diferencia en milisegundos y luego en días
            const diffTime = licenseDate.getTime() - today.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            // 1. SI YA VENCIÓ (Días negativos o cero exacto en pasado) -> Redirigir
            if (licenseDate < today) {
              router.replace('/license-expired')
              return 
            }

            // 2. SI VENCE EN 5 DÍAS O MENOS -> Mostrar Alerta
            if (diffDays >= 0 && diffDays <= 5) {
                setExpirationAlert({ show: true, days: diffDays })
            } else {
                setExpirationAlert(null)
            }
        }

        // --- CARGA DE MÓDULOS ---
        if (metadata?.modules) {
          setModules(metadata.modules)
        } else {
          setModules({ stock: true }) 
        }

      } catch (error) {
        console.error("Error verificando estado:", error)
      } finally {
        setLoading(false)
      }
    }

    checkUserStatus()
  }, [pathname, router])

  // --- PANTALLA DE CARGA ---
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2 animate-in fade-in">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500 font-medium">Verificando credenciales...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      <OnboardingModal />

      {/* --- OVERLAY MÓVIL --- */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[90] md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-[100] w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl
        md:relative md:translate-x-0 md:z-0 md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        <div>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-black-600 hidden md:block px-2">
              nexO<span className="text-blue-600">stock📦</span>
            </h2>
            <span className="text-xl font-bold text-blue-600 md:hidden">Menú</span>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
               <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="space-y-2">
            {(modules.stock !== false) && (
              <a href="/dashboard" onClick={() => setIsSidebarOpen(false)} className="block px-4 py-2 rounded-lg bg-blue-50 font-medium text-blue-700 hover:bg-blue-100 transition-colors">
                Productos / Stock
              </a>
            )}
            {modules.ventas && (
              <a href="/dashboard/ventas" onClick={() => setIsSidebarOpen(false)} className="block px-4 py-2 rounded-lg hover:bg-slate-50 font-medium text-slate-600 transition-colors">
                Ventas
              </a>
            )}
            {modules.reportes && (
              <a href="/dashboard/reportes" onClick={() => setIsSidebarOpen(false)} className="block px-4 py-2 rounded-lg hover:bg-slate-50 font-medium text-slate-600 transition-colors">
                Reportes
              </a>
            )}
          </nav>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100">
           <UserProfile />
        </div>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        
        {/* Header Móvil */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
          <span className="font-bold text-blue-600 text-lg">nexOstock</span>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* --- NUEVA ALERTA DE VENCIMIENTO --- */}
        {expirationAlert && expirationAlert.show && (
          <div className="bg-orange-50 border-b border-orange-200 p-4 animate-in slide-in-from-top-2">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              
              <div className="flex gap-3">
                <AlertTriangle className="h-6 w-6 text-orange-600 shrink-0 mt-1 md:mt-0" />
                <div>
                  <h4 className="font-bold text-orange-800">
                    Tu licencia vence en {expirationAlert.days} {expirationAlert.days === 1 ? 'día' : 'días'}.
                  </h4>
                  <p className="text-sm text-orange-700 mt-1">
                    Evita la suspensión del servicio. Si ya realizaste el pago, por favor envía el comprobante.
                  </p>
                </div>
              </div>

              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700 text-white border-0 shrink-0 w-full md:w-auto"
                onClick={() => window.open('https://wa.me/5493815123456?text=Hola,%20ya%20realicé%20el%20pago%20de%20mi%20licencia,%20adjunto%20comprobante.', '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Enviar Comprobante
              </Button>

            </div>
          </div>
        )}

        <div className="p-4 md:p-8 flex-1">
          <SubscriptionGuard>
            {children}
          </SubscriptionGuard>
        </div>
        
      </main>
      
    </div>
  )
}