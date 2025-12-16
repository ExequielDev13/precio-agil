"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function LicenseExpiredPage() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl border-red-200">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-700">
            ¡Licencia Vencida!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-slate-600">
            Tu acceso al sistema <strong>nexOstock</strong> ha expirado. 
            Para continuar operando y recuperar el acceso a tus datos, por favor contacta al administrador para renovar tu plan.
          </p>
          
          <div className="bg-white p-4 rounded border border-red-100 text-sm text-slate-500">
            Si ya realizaste el pago, cierra sesión y vuelve a ingresar para actualizar el estado.
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button 
                className="w-full bg-green-600 hover:bg-green-700 gap-2"
                onClick={() => window.open('https://wa.me/5493815123456', '_blank')} // Tu número de WhatsApp
            >
              <ExternalLink className="h-4 w-4" /> Contactar Soporte (WhatsApp)
            </Button>
            
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}