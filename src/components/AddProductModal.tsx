'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from 'lucide-react'

export function AddProductModal({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Estados
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [supplier, setSupplier] = useState('')
  const [marca, setMarca] = useState('')           // <--- NUEVO
  const [descripcion, setDescripcion] = useState('') // <--- NUEVO
  const [cost, setCost] = useState('')
  const [margin, setMargin] = useState('30')
  const [stock, setStock] = useState('0')
  const [minStock, setMinStock] = useState('5')

  const formatText = (text: string) => {
    if (!text) return ''
    const clean = text.trim()
    return clean.charAt(0).toUpperCase() + clean.slice(1)
  }

  const handleSave = async () => {
    setLoading(true)
    
    // Aplicamos formato
    const cleanName = formatText(name)
    const cleanCategory = formatText(category)
    const cleanSubcategory = formatText(subcategory)
    const cleanSupplier = formatText(supplier)
    const cleanMarca = formatText(marca) // <--- Formateamos marca

    const costNumber = parseFloat(cost)
    const marginNumber = parseFloat(margin)
    const calculatedSalePrice = costNumber * (1 + marginNumber / 100)

    try {
      const { error } = await supabase.from('products').insert({
        user_id: userId,
        name: cleanName,
        category: cleanCategory,
        subcategory: cleanSubcategory,
        supplier: cleanSupplier,
        marca: cleanMarca,            // <--- ENVIAMOS A SUPABASE
        descripcion: descripcion,     // <--- ENVIAMOS A SUPABASE
        cost_price: costNumber,
        sale_price: calculatedSalePrice,
        stock: parseInt(stock),
        min_stock: parseInt(minStock),
        last_restock_date: new Date().toISOString(),
        sold_today: 0,
        sku: '',
      })

      if (error) throw error

      setOpen(false)
      // Resetear formulario
      setName(''); setCategory(''); setSubcategory(''); setSupplier(''); 
      setMarca(''); setDescripcion(''); // <--- Reset nuevos
      setCost(''); setStock('0'); setMinStock('5')
      
      router.refresh()
      window.location.reload()
    } catch (error: any) {
      alert('Error: ' + error.message)
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
      <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Ficha de Producto</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          
          <div className="grid gap-2">
            <Label>Nombre del Producto</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Pipeta Frontline 10kg" />
          </div>

          {/* NUEVOS CAMPOS MARCA Y DESCRIPCION */}
          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
                <Label>Marca</Label>
                <Input value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Ej: Boehringer" />
             </div>
             <div className="grid gap-2">
                <Label>Proveedor</Label>
                <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Distribuidora X" />
             </div>
          </div>

          <div className="grid gap-2">
             <Label>Descripción</Label>
             <textarea 
                className="flex w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                rows={2}
                value={descripcion} 
                onChange={(e) => setDescripcion(e.target.value)} 
                placeholder="Detalles adicionales, dosis, etc..." 
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label>Rubro</Label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Farmacia" />
            </div>
            <div className="grid gap-2">
                <Label>Subrubro</Label>
                <Input value={subcategory} onChange={(e) => setSubcategory(e.target.value)} placeholder="Antipulgas" />
            </div>
          </div>

          <div className="h-px bg-slate-100 my-2"></div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2"><Label>Costo ($)</Label><Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Margen (%)</Label><Input type="number" value={margin} onChange={(e) => setMargin(e.target.value)} /></div>
            <div className="grid gap-2">
               <Label className="text-blue-600 font-bold">Precio Final</Label>
               <div className="h-10 flex items-center px-3 border rounded-md bg-slate-50 font-bold">
                 ${cost && margin ? (parseFloat(cost) * (1 + parseFloat(margin)/100)).toFixed(2) : '0.00'}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Stock Inicial</Label><Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Alerta Mínima</Label><Input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} /></div>
          </div>

        </div>
        <Button onClick={handleSave} disabled={loading || !name || !cost} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          {loading ? 'Guardando...' : 'Guardar Ficha'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}