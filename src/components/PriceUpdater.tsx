'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw, Filter, Loader2 } from 'lucide-react'
import { toast } from "sonner" // <--- Usamos las notificaciones lindas

// Componente de Selección Simple
const Select = ({ label, options, value, onChange }: any) => (
  <div className="grid gap-2">
    <Label>{label}</Label>
    <select 
      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">-- Todos --</option>
      {options.map((opt: string) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
)

export function PriceUpdater({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [percentage, setPercentage] = useState('')
  
  // Filtros
  const [categories, setCategories] = useState<string[]>([])
  const [suppliers, setSuppliers] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState('')

  const router = useRouter()

  // Cargar listas de Rubros y Proveedores al abrir
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        const { data } = await supabase.from('products').select('category, supplier').eq('user_id', userId)
        if (data) {
          // Extraer únicos y limpiar nulos
          const cats = Array.from(new Set(data.map(p => p.category).filter(Boolean))) as string[]
          const supps = Array.from(new Set(data.map(p => p.supplier).filter(Boolean))) as string[]
          setCategories(cats.sort())
          setSuppliers(supps.sort())
        }
      }
      fetchData()
    }
  }, [open, userId])

  const handleUpdate = async () => {
    if (!percentage) return
    
    // Mensaje de confirmación detallado
    let msg = `⚠️ ¿Confirmas aumentar un ${percentage}%`
    if (selectedCategory) msg += ` al rubro "${selectedCategory}"`
    if (selectedSupplier) msg += ` del proveedor "${selectedSupplier}"`
    if (!selectedCategory && !selectedSupplier) msg += ` a TODOS los productos`
    msg += `?`

    if (!window.confirm(msg)) return

    setLoading(true)
    try {
      // Llamada a la función RPC SQL (Asegúrate de haberla creado en Supabase)
      const { error } = await supabase.rpc('update_prices_by_percentage', {
        percentage: parseFloat(percentage),
        filter_category: selectedCategory || null,
        filter_supplier: selectedSupplier || null
      })

      if (error) throw error

      toast.success(`✅ Precios actualizados un ${percentage}% correctamente`)
      
      setOpen(false)
      setPercentage('')
      setSelectedCategory('')
      setSelectedSupplier('')
      
      router.refresh() // Actualiza la vista sin recargar la página

    } catch (error: any) {
      console.error(error)
      toast.error(`Error al actualizar: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-slate-800 hover:bg-slate-900 text-white gap-2 shadow-sm font-medium">
          <RefreshCw className="h-4 w-4" /> Actualizar Precios
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] bg-white">
        <DialogHeader>
          <DialogTitle>Actualización Masiva</DialogTitle>
          <DialogDescription>Aplica aumentos generales o por proveedor.</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="bg-blue-50 p-3 rounded-md border border-blue-100 text-sm text-blue-800 flex gap-2">
            <Filter className="h-4 w-4 mt-0.5 shrink-0" />
            <p>Puedes filtrar a qué productos aplicar el aumento. Si dejas "Todos", se aplicará a todo el inventario.</p>
          </div>

          <Select 
            label="Filtrar por Proveedor" 
            options={suppliers} 
            value={selectedSupplier} 
            onChange={setSelectedSupplier} 
          />

          <Select 
            label="Filtrar por Rubro" 
            options={categories} 
            value={selectedCategory} 
            onChange={setSelectedCategory} 
          />

          <div className="grid gap-2">
            <Label htmlFor="percent" className="font-bold">Porcentaje de Aumento (%)</Label>
            <Input 
              id="percent" 
              type="number" 
              placeholder="Ej: 15" 
              value={percentage} 
              onChange={(e) => setPercentage(e.target.value)} 
              className="font-bold text-lg"
            />
          </div>
        </div>

        <Button onClick={handleUpdate} disabled={loading || !percentage} className="w-full bg-slate-900 hover:bg-black text-white">
          {loading ? (
            <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando... </>
          ) : (
            'Aplicar Aumento'
          )}
        </Button>
      </DialogContent>
    </Dialog>
  )
}