'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from 'lucide-react'

export function AddProductModal({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [name, setName] = useState('')
  const [cost, setCost] = useState('')
  const [margin, setMargin] = useState('30')
  const [stock, setStock] = useState('0')

  const handleSave = async () => {
    setLoading(true)
    
    // 1. Lógica de Mayúscula Inicial
    const cleanName = name.trim()
    const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)

    const costNumber = parseFloat(cost)
    const marginNumber = parseFloat(margin)
    const calculatedSalePrice = costNumber * (1 + marginNumber / 100)

    try {
      const { error } = await supabase.from('products').insert({
        user_id: userId,
        name: formattedName, // Usamos el nombre formateado
        cost_price: costNumber,
        sale_price: calculatedSalePrice,
        stock: parseInt(stock),
        sku: '',
      })

      if (error) throw error

      setOpen(false)
      setName(''); setCost(''); setStock('0')
      router.refresh()
      window.location.reload()
    } catch (error: any) {
      alert('Error al guardar: ' + (error.message || "Intenta de nuevo"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm font-medium">
          <Plus className="h-4 w-4" /> Nuevo Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader><DialogTitle>Agregar Producto</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Ej: Pipeta para gatos"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cost">Costo ($)</Label>
              <Input id="cost" type="number" value={cost} onChange={(e) => setCost(e.target.value)} />
            </div>
            <div className="grid gap-2">
               <Label htmlFor="stock">Stock</Label>
               <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="margin">Margen (%)</Label>
            <Input id="margin" type="number" value={margin} onChange={(e) => setMargin(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleSave} disabled={loading || !name || !cost} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}