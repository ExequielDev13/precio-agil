'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Trash2, PackageOpen, PlusCircle, MinusCircle, Tag, Truck } from 'lucide-react'
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Product { 
  id: string, 
  name: string, 
  category: string | null,
  subcategory: string | null,
  supplier: string | null,
  marca: string | null,        // Campo nuevo
  descripcion: string | null,  // Campo nuevo
  cost_price: number, 
  sale_price: number, 
  stock: number,
  min_stock: number,
  sold_today: number,
  last_restock_date: string
}

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const fetchProducts = async () => {
    try {
      const { data } = await supabase.from('products').select('*').order('name', { ascending: true })
      if (data) setProducts(data)
    } finally { setLoading(false) }
  }

  // --- LÓGICA DE SELECCIÓN ---
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const visibleIds = filtered.map(p => p.id)
      setSelectedIds(visibleIds)
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id))
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`⚠️ ¿Estás seguro de eliminar ${selectedIds.length} productos?\nEsta acción no se puede deshacer.`)) return

    const { error } = await supabase.from('products').delete().in('id', selectedIds)
    
    if (error) {
      toast.error("Error al eliminar")
    } else {
      setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)))
      setSelectedIds([])
      toast.success("Productos eliminados correctamente")
    }
  }

  // --- LÓGICA DE STOCK Y VENTAS ---
  const handleSell = async (product: Product) => {
    if (product.stock <= 0) { toast.error("Sin stock"); return }
    const newStock = product.stock - 1
    const newSold = (product.sold_today || 0) + 1
    updateLocalProduct(product.id, { stock: newStock, sold_today: newSold })
    await supabase.from('products').update({ stock: newStock, sold_today: newSold }).eq('id', product.id)
    toast.success(`Venta registrada`)
  }

  const handleRestock = async (product: Product) => {
    const amountStr = prompt(`Ingreso de stock para ${product.name}:`, "10")
    if (!amountStr) return
    const amount = parseInt(amountStr)
    if (isNaN(amount) || amount <= 0) return
    const newStock = product.stock + amount
    const now = new Date().toISOString()
    updateLocalProduct(product.id, { stock: newStock, last_restock_date: now })
    await supabase.from('products').update({ stock: newStock, last_restock_date: now }).eq('id', product.id)
    toast.success(`Ingresaron ${amount} unidades`)
  }

  const updateLocalProduct = (id: string, updates: Partial<Product>) => {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  const handleDelete = async (id: string) => {
    if(!confirm("¿Borrar producto definitivamente?")) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) {
        setProducts(products.filter(p => p.id !== id))
        toast.success("Producto eliminado")
    }
  }

  useEffect(() => { fetchProducts() }, [])

  // --- FILTRADO ---
  const filtered = products.filter(p => {
    const search = searchTerm.toLowerCase()
    return (
      p.name.toLowerCase().includes(search) || 
      (p.category && p.category.toLowerCase().includes(search)) ||
      (p.supplier && p.supplier.toLowerCase().includes(search)) ||
      (p.marca && p.marca.toLowerCase().includes(search))
    )
  })

  return (
    <div className="p-6 space-y-6">
      
      <div className="flex justify-between items-center gap-4">
        {/* BUSCADOR */}
        <div className="relative w-full max-w-md">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="h-5 w-5" />
            </div>
            <Input 
            placeholder="Buscar por nombre, marca o rubro..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-slate-50 border-slate-200 text-base" 
            />
        </div>

        {/* BOTÓN DE BORRADO MASIVO */}
        {selectedIds.length > 0 && (
            <Button 
                variant="destructive" 
                onClick={handleBulkDelete}
                className="animate-in fade-in zoom-in duration-200 shadow-md bg-red-600 hover:bg-red-700"
            >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar seleccionados ({selectedIds.length})
            </Button>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
        <Table>
          {/* AQUÍ ESTABA EL ERROR: He limpiado los espacios entre TableHead */}
          <TableHeader className="bg-slate-100">
            <TableRow>
              <TableHead className="w-[40px] pl-4">
                <Checkbox 
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    aria-label="Seleccionar todo"
                />
              </TableHead>
              <TableHead className="w-[30%] font-bold text-slate-700">Producto</TableHead>
              <TableHead className="font-bold text-slate-700">Marca / Detalles</TableHead>
              <TableHead className="text-center font-bold text-slate-700">Stock</TableHead>
              <TableHead className="text-right font-bold text-slate-700">Costo</TableHead>
              <TableHead className="text-right pr-6 font-bold text-slate-700">Venta</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {loading ? (
               <TableRow><TableCell colSpan={7} className="h-32 text-center text-slate-400">Cargando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
               <TableRow><TableCell colSpan={7} className="h-40 text-center text-slate-400"><div className="flex flex-col items-center gap-2"><PackageOpen className="h-8 w-8 opacity-50"/><span>Sin resultados</span></div></TableCell></TableRow>
            ) : (
              filtered.map((product) => (
                <TableRow key={product.id} className={`hover:bg-slate-50 ${selectedIds.includes(product.id) ? 'bg-blue-50/50' : ''}`}>
                  
                  <TableCell className="pl-4 align-top pt-5">
                    <Checkbox 
                        checked={selectedIds.includes(product.id)}
                        onCheckedChange={(checked) => handleSelectOne(product.id, !!checked)}
                        aria-label="Seleccionar fila"
                    />
                  </TableCell>

                  <TableCell className="py-4 align-top">
                    <div className="font-bold text-slate-800 text-base mb-1">{product.name}</div>
                    <div className="flex flex-wrap gap-2">
                        {product.category && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-normal px-2 py-0.5 h-auto">
                                <Tag className="h-3 w-3 mr-1" /> {product.category} {product.subcategory && `> ${product.subcategory}`}
                            </Badge>
                        )}
                        {product.supplier && (
                            <Badge variant="outline" className="text-slate-500 border-slate-300 font-normal px-2 py-0.5 h-auto">
                                <Truck className="h-3 w-3 mr-1" /> {product.supplier}
                            </Badge>
                        )}
                    </div>
                  </TableCell>

                  {/* NUEVA COLUMNA: MARCA Y DESCRIPCION */}
                  <TableCell className="py-4 align-top">
                    <div className="flex flex-col gap-1">
                        <span className="font-medium text-slate-700">{product.marca || '-'}</span>
                        <span className="text-xs text-slate-500 max-w-[200px] truncate" title={product.descripcion || ''}>
                            {product.descripcion || ''}
                        </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-center align-middle">
                    <div className="flex items-center justify-center gap-3">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={() => handleSell(product)} size="icon" variant="outline" className="h-8 w-8 rounded-full border-red-200 text-red-600 hover:bg-red-50"><MinusCircle className="h-5 w-5" /></Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Vender 1</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <div className="flex flex-col items-center min-w-[30px]">
                            <span className={`font-mono font-bold text-lg ${product.stock <= (product.min_stock || 5) ? 'text-red-600' : 'text-slate-700'}`}>{product.stock}</span>
                            {product.sold_today > 0 && <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1 rounded">-{product.sold_today}</span>}
                        </div>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={() => handleRestock(product)} size="icon" variant="outline" className="h-8 w-8 rounded-full border-emerald-200 text-emerald-600 hover:bg-emerald-50"><PlusCircle className="h-5 w-5" /></Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Reponer Stock</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                  </TableCell>

                  <TableCell className="text-right text-slate-500 font-mono align-middle">${product.cost_price.toFixed(2)}</TableCell>
                  <TableCell className="text-right pr-6 align-middle"><div className="font-bold text-slate-900 font-mono text-lg">${product.sale_price.toFixed(2)}</div></TableCell>
                  
                  <TableCell className="text-right align-middle">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="text-slate-300 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}