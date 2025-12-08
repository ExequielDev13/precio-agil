'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AddProductModal({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Datos del formulario
  const [name, setName] = useState('')
  const [cost, setCost] = useState('')
  const [margin, setMargin] = useState('30') // 30% por defecto
  const [stock, setStock] = useState('0')

  const handleSave = async () => {
    setLoading(true)
    
    // Calculamos el precio de venta final aquí antes de enviar
    const costNumber = parseFloat(cost)
    const marginNumber = parseFloat(margin)
    const calculatedSalePrice = costNumber * (1 + marginNumber / 100)

    try {
      const { error } = await supabase.from('products').insert({
        user_id: userId,
        name: name,
        cost_price: costNumber,
        sale_price: calculatedSalePrice, // Enviamos el precio calculado
        stock: parseInt(stock),          // Enviamos el stock
        sku: '',                         // Enviamos vacío por ahora para que no falle
      })

      if (error) throw error

      setOpen(false)
      setName('')
      setCost('')
      setStock('0')
      router.refresh()
      window.location.reload()
    } catch (error) {
      console.error(error) // Aquí verás el error real en la consola si falla
      alert('Error al guardar el producto. Revisa la consola (F12) para más detalles.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          + Nuevo Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Agregar Producto</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Martillo" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cost">Costo ($)</Label>
              <Input id="cost" type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="100" />
            </div>
            <div className="grid gap-2">
               <Label htmlFor="stock">Stock</Label>
               <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="margin">Margen de Ganancia (%)</Label>
            <Input id="margin" type="number" value={margin} onChange={(e) => setMargin(e.target.value)} />
          </div>

          {cost && (
            <div className="p-3 bg-slate-100 rounded text-center">
              <span className="text-sm text-slate-500">Precio de Venta:</span>
              <p className="text-xl font-bold text-green-600">
                ${(parseFloat(cost) * (1 + parseFloat(margin || '0') / 100)).toFixed(2)}
              </p>
            </div>
          )}
        </div>
        
        <Button onClick={handleSave} disabled={loading || !name || !cost}>
          {loading ? 'Guardando...' : 'Guardar Producto'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}