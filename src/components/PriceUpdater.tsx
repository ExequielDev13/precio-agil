'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw } from 'lucide-react'

export function PriceUpdater({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [percentage, setPercentage] = useState('')
  const router = useRouter()

  const handleUpdate = async () => {
    if (!percentage) return
    if (!window.confirm(`⚠️ ¿Aumentar precios un ${percentage}%?`)) return

    setLoading(true)
    try {
      const { error } = await supabase.rpc('update_prices_by_percentage', { percentage: parseFloat(percentage) })
      if (error) throw error
      alert(`¡Precios actualizados!`)
      setOpen(false); setPercentage('')
      router.refresh()
      window.location.reload()
    } catch (error: any) {
      // CORRECCIÓN AQUÍ: Usamos alert
      alert(`Error: ${error.message || "Desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-slate-600 hover:bg-slate-700 text-white gap-2 shadow-sm font-medium">
          <RefreshCw className="h-4 w-4" /> Actualizar Precios
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] bg-white">
        <DialogHeader><DialogTitle>Actualización Masiva</DialogTitle><DialogDescription>Ajuste porcentual.</DialogDescription></DialogHeader>
        <div className="py-4"><Label>Porcentaje (%)</Label><Input type="number" placeholder="Ej: 10" value={percentage} onChange={(e) => setPercentage(e.target.value)} className="mt-2" /></div>
        <Button onClick={handleUpdate} disabled={loading || !percentage} className="w-full bg-slate-800 text-white">{loading ? 'Aplicando...' : 'Aplicar'}</Button>
      </DialogContent>
    </Dialog>
  )
}