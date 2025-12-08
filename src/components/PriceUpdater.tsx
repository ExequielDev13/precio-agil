'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function PriceUpdater({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [percentage, setPercentage] = useState('')
  const router = useRouter()

  const handleUpdate = async () => {
    if (!percentage) return
    
    const confirm = window.confirm(`⚠️ ¿Estás seguro de aumentar TODOS tus costos un ${percentage}%?`)
    if (!confirm) return

    setLoading(true)

    try {
      // --- CAMBIO AQUÍ: Ya no enviamos target_user_id ---
      // Solo enviamos el porcentaje. Supabase sabe quién eres.
      const { error } = await supabase.rpc('update_prices_by_percentage', {
        percentage: parseFloat(percentage)
      })

      if (error) {
        console.error("Error detallado de Supabase:", error)
        throw error
      }

      alert(`¡Precios actualizados correctamente!`)
      setOpen(false)
      setPercentage('')
      router.refresh()
      window.location.reload()

    } catch (error: any) {
      console.error("Error capturado:", error)
      // Mostramos el mensaje real del error si existe
      alert(`Hubo un error: ${error.message || error.details || "Desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="bg-orange-600 hover:bg-orange-700 text-white">
          📈 Actualizar Precios
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] bg-white">
        <DialogHeader>
          <DialogTitle>Actualización Masiva</DialogTitle>
          <DialogDescription>
            Ingresa el porcentaje. El sistema calculará automáticamente los nuevos costos y precios de venta.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="percent">Porcentaje (%)</Label>
            <Input 
              id="percent" 
              type="number" 
              placeholder="Ej: 10" 
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={handleUpdate} disabled={loading || !percentage} className="bg-orange-600 hover:bg-orange-700">
          {loading ? 'Aplicando...' : 'Aplicar Aumento'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}