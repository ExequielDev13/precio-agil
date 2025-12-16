'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Lock, Save } from 'lucide-react' // Icono Lock para mostrar que está bloqueado
import { toast } from "sonner"

// Definimos la interfaz del producto para recibirlo
interface Product {
  id: string
  sku: string | null
  supplier_code: string | null
  name: string
  category: string | null
  subcategory: string | null
  supplier: string | null
  marca: string | null
  descripcion: string | null
  cost_price: number
  sale_price: number
  stock: number
  min_stock: number
  margin_percentage?: number
}

interface Props {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void // Para recargar la lista al terminar
}

export function EditProductModal({ product, isOpen, onClose, onUpdate }: Props) {
  const [loading, setLoading] = useState(false)

  // Estados
  const [sku, setSku] = useState('')
  const [supplierCode, setSupplierCode] = useState('')
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [supplier, setSupplier] = useState('')
  const [marca, setMarca] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [cost, setCost] = useState('')
  const [margin, setMargin] = useState('30')
  const [stock, setStock] = useState('0')
  const [minStock, setMinStock] = useState('5')

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (product && isOpen) {
      setSku(product.sku || '')
      setSupplierCode(product.supplier_code || '')
      setCategory(product.category || '')
      setSubcategory(product.subcategory || '')
      setSupplier(product.supplier || '')
      setMarca(product.marca || '')
      setDescripcion(product.descripcion || '')
      setCost(product.cost_price.toString())
      setStock(product.stock.toString())
      setMinStock(product.min_stock.toString())
      
      // Calcular margen inverso basado en precio de venta y costo
      // Margen = ((PrecioVenta / Costo) - 1) * 100
      if (product.cost_price > 0) {
        const calculatedMargin = ((product.sale_price / product.cost_price) - 1) * 100
        setMargin(calculatedMargin.toFixed(2)) // Redondeamos
      }
    }
  }, [product, isOpen])

  const formatTitle = (text: string) => {
    if (!text) return ''
    const clean = text.trim()
    return clean.charAt(0).toUpperCase() + clean.slice(1)
  }

  const handleUpdate = async () => {
    if (!product) return
    setLoading(true)

    // Formateos
    const cleanCategory = formatTitle(category)
    const cleanSubcategory = formatTitle(subcategory)
    const finalSupplierCode = supplierCode.toUpperCase().trim()
    const finalMarca = marca.toUpperCase().trim()
    const finalSupplier = supplier.toUpperCase().trim()
    const finalDescripcion = descripcion.toUpperCase().trim()

    // Lógica de Nombre (mismo fallback que en creación)
    const dbNameFallback = finalSupplierCode || finalDescripcion.slice(0, 50) || "SIN NOMBRE";

    const costNumber = parseFloat(cost)
    const marginNumber = parseFloat(margin)
    const calculatedSalePrice = costNumber * (1 + marginNumber / 100)

    try {
      const { error } = await supabase.from('products').update({
        supplier_code: finalSupplierCode,
        name: dbNameFallback,
        category: cleanCategory,
        subcategory: cleanSubcategory,
        supplier: finalSupplier,
        marca: finalMarca,
        descripcion: finalDescripcion,
        cost_price: costNumber,
        sale_price: calculatedSalePrice,
        stock: parseInt(stock),
        min_stock: parseInt(minStock),
        // NO actualizamos 'sku' ni 'created_at' ni 'user_id'
      }).eq('id', product.id)

      if (error) throw error

      toast.success("Producto actualizado correctamente")
      onUpdate() // Avisamos al padre que recargue
      onClose()  // Cerramos

    } catch (error: any) {
      console.error(error)
      toast.error('Error al actualizar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar Producto</DialogTitle></DialogHeader>
        <div className="grid gap-5 py-4">
          
          {/* CÓDIGOS */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
             
             {/* CÓDIGO INTERNO (BLOQUEADO) */}
             <div className="grid gap-2">
                <Label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                    Código Interno <Lock className="h-3 w-3"/>
                </Label>
                <Input 
                    value={sku} 
                    disabled // <--- ESTO LO BLOQUEA
                    className="bg-slate-200 font-mono font-bold text-slate-500 border-slate-300 cursor-not-allowed" 
                />
             </div>

             <div className="grid gap-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">Cód. Proveedor</Label>
                <Input 
                    value={supplierCode} 
                    onChange={(e) => setSupplierCode(e.target.value.toUpperCase())} 
                    className="bg-white font-bold"
                />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
                <Label>Marca</Label>
                <Input value={marca} onChange={(e) => setMarca(e.target.value.toUpperCase())} />
             </div>
             <div className="grid gap-2">
                <Label>Proveedor</Label>
                <Input value={supplier} onChange={(e) => setSupplier(e.target.value.toUpperCase())} />
             </div>
          </div>

          <div className="grid gap-2">
             <Label>Descripción / Detalles</Label>
             <textarea 
                className="flex w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 min-h-[80px] resize-none uppercase"
                value={descripcion} 
                onChange={(e) => setDescripcion(e.target.value.toUpperCase())} 
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Rubro</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Subrubro</Label><Input value={subcategory} onChange={(e) => setSubcategory(e.target.value)} /></div>
          </div>

          <div className="h-px bg-slate-100 my-2"></div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2"><Label>Costo ($)</Label><Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Margen (%)</Label><Input type="number" value={margin} onChange={(e) => setMargin(e.target.value)} /></div>
            <div className="grid gap-2">
               <Label className="text-blue-600 font-bold">Precio Final</Label>
               <div className="h-10 flex items-center px-3 border rounded-md bg-slate-50 font-bold text-slate-700 text-lg">
                 ${cost && margin ? (parseFloat(cost) * (1 + parseFloat(margin)/100)).toFixed(2) : '0.00'}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Stock Actual</Label><Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Alerta Mínima</Label><Input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} /></div>
          </div>

        </div>
        
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleUpdate} disabled={loading || !cost} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px]">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4"/> Guardar Cambios</>}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}