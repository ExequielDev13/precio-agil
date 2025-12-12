'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

// Reutilizamos la misma lista de ubicaciones
const LOCATIONS: Record<string, string[]> = {
  "Argentina": ["Buenos Aires", "CABA", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", "Entre Ríos", "Salta", "Misiones", "Chaco", "Corrientes", "Santiago del Estero", "San Juan", "Jujuy", "Río Negro", "Neuquén", "Formosa", "Chubut", "San Luis", "Catamarca", "La Rioja", "La Pampa", "Santa Cruz", "Tierra del Fuego"],
  "Uruguay": ["Montevideo", "Canelones", "Maldonado", "Salto", "Colonia", "Paysandú", "San José", "Rivera", "Tacuarembó", "Cerro Largo", "Soriano", "Artigas", "Rocha", "Florida", "Lavalleja", "Durazno", "Río Negro", "Treinta y Tres", "Flores"],
  "Chile": ["Santiago", "Valparaíso", "Concepción", "La Serena", "Antofagasta", "Temuco", "Rancagua", "Iquique", "Talca", "Arica", "Puerto Montt", "Chillán", "Los Ángeles", "Calama", "Copiapó", "Osorno", "Quillota", "Valdivia"],
  "México": ["CDMX", "Jalisco", "Nuevo León", "Puebla", "Guanajuato", "Veracruz", "Yucatán", "Quintana Roo", "Chiapas", "Oaxaca"],
  "Colombia": ["Bogotá", "Antioquia", "Valle del Cauca", "Cundinamarca", "Atlántico", "Santander", "Bolívar"],
  "Otro": ["Otra"]
}

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Estados del formulario
  const [country, setCountry] = useState('')
  const [province, setProvince] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [whatsapp, setWhatsapp] = useState('')

  const availableProvinces = useMemo(() => {
    return country ? LOCATIONS[country] || [] : []
  }, [country])

  useEffect(() => {
    const checkUserMetadata = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Verificamos si falta algún dato crítico en los metadatos
        const meta = user.user_metadata || {}
        if (!meta.country || !meta.business_type || !meta.whatsapp) {
          setIsOpen(true) // ABRIMOS EL MODAL
        }
      }
    }
    checkUserMetadata()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!country || !province || !businessType || !whatsapp) {
        toast.error("Por favor completa todos los campos")
        setLoading(false)
        return
    }

    try {
      // ACTUALIZAMOS EL USUARIO CON LOS DATOS FALTANTES
      const { error } = await supabase.auth.updateUser({
        data: {
            country,
            province,
            business_type: businessType,
            whatsapp
        }
      })

      if (error) throw error

      toast.success("¡Perfil completado!")
      setIsOpen(false) // Cerramos el modal
      router.refresh()

    } catch (error: any) {
      toast.error("Error al guardar: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  // onOpenChange={() => {}} evita que se cierre haciendo clic afuera
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}> 
      <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-600 text-center">¡Casi listos! 🚀</DialogTitle>
          <DialogDescription className="text-center">
            Para terminar de configurar tu cuenta, necesitamos unos últimos detalles sobre tu negocio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-4">
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>País</Label>
                    <Select onValueChange={(val) => { setCountry(val); setProvince(''); }}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                            {Object.keys(LOCATIONS).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Provincia</Label>
                    <Select onValueChange={setProvince} disabled={!country}>
                        <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
                        <SelectContent>
                            {availableProvinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Tipo de Negocio</Label>
                <Input 
                    placeholder="Ej: Veterinaria, Pet Shop..." 
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label>WhatsApp de Contacto</Label>
                <Input 
                    type="tel"
                    placeholder="+54 9..." 
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 mt-4" disabled={loading}>
                {loading ? 'Guardando...' : 'Completar Registro'}
            </Button>

        </form>
      </DialogContent>
    </Dialog>
  )
}