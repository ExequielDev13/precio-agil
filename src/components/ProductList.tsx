'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Search, Trash2, PackageOpen, PlusCircle, MinusCircle, 
  Tag, Truck, X, Loader2, ShoppingCart, ArrowDownToLine, AlertCircle, Check
} from 'lucide-react'
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
  marca: string | null,
  descripcion: string | null,
  cost_price: number, 
  sale_price: number, 
  stock: number,
  min_stock: number,
  sold_today: number,
  last_restock_date: string
}

type ActionType = 'sell' | 'restock' | null

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // --- ESTADOS DEL MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [actionType, setActionType] = useState<ActionType>(null)
  const [quantityInput, setQuantityInput] = useState<string>('1')
  const [processing, setProcessing] = useState(false)

  const fetchProducts = async () => {
    try {
      const { data } = await supabase.from('products').select('*').order('name', { ascending: true })
      if (data) setProducts(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [])

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

  const handleDelete = async (id: string) => {
    if(!confirm("¿Borrar producto definitivamente?")) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) {
        setProducts(products.filter(p => p.id !== id))
        toast.success("Producto eliminado")
    }
  }

  // --- LÓGICA DEL MODAL (NUEVA) ---

  const handleOpenModal = (product: Product, type: ActionType) => {
    setSelectedProduct(product)
    setActionType(type)
    setQuantityInput('1')
    setIsModalOpen(true)
  }

  const handleConfirmAction = async () => {
    if (!selectedProduct || !actionType) return

    const qty = parseInt(quantityInput)
    if (isNaN(qty) || qty <= 0) {
        toast.error("Ingresa una cantidad válida")
        return
    }

    if (actionType === 'sell' && qty > selectedProduct.stock) {
        toast.error("Stock insuficiente")
        return
    }

    setProcessing(true)

    try {
        let updates: Partial<Product> = {}
        let newStock = 0

        if (actionType === 'sell') {
            newStock = selectedProduct.stock - qty
            const newSold = (selectedProduct.sold_today || 0) + qty
            updates = { stock: newStock, sold_today: newSold }
            toast.success(`Venta de ${qty} unidades registrada`)
        } else {
            // Restock logic
            newStock = selectedProduct.stock + qty
            const now = new Date().toISOString()
            updates = { stock: newStock, last_restock_date: now }
            toast.success(`Ingresaron ${qty} unidades al stock`)
        }

        // 1. Actualizar UI Local
        setProducts(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, ...updates } : p))

        // 2. Actualizar Supabase
        const { error } = await supabase.from('products').update(updates).eq('id', selectedProduct.id)
        if (error) throw error

        setIsModalOpen(false)
        setSelectedProduct(null)
        setActionType(null)

    } catch (err) {
        console.error(err)
        toast.error("Error al actualizar la base de datos")
    } finally {
        setProcessing(false)
    }
  }

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
      
      {/* HEADER: BUSCADOR Y ACCIONES MASIVAS */}
      <div className="flex justify-between items-center gap-4">
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

      {/* TABLA DE PRODUCTOS */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
        <Table>
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

                  <TableCell className="py-4 align-top">
                    <div className="flex flex-col gap-1">
                        <span className="font-medium text-slate-700">{product.marca || '-'}</span>
                        <span className="text-xs text-slate-500 max-w-[200px] truncate" title={product.descripcion || ''}>
                            {product.descripcion || ''}
                        </span>
                    </div>
                  </TableCell>

                  {/* COLUMNA STOCK Y ACCIONES DE CANTIDAD */}
                  <TableCell className="text-center align-middle">
                    <div className="flex items-center justify-center gap-3">
                        {/* BOTÓN VENDER (MENOS) */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button 
                                      onClick={() => product.stock > 0 && handleOpenModal(product, 'sell')} 
                                      size="icon" 
                                      variant="outline" 
                                      disabled={product.stock <= 0}
                                      className={`h-8 w-8 rounded-full border-red-200 text-red-600 hover:bg-red-50 ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                      <MinusCircle className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Registrar Venta (Salida)</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <div className="flex flex-col items-center min-w-[30px]">
                            <span className={`font-mono font-bold text-lg ${product.stock <= (product.min_stock || 5) ? 'text-red-600' : 'text-slate-700'}`}>{product.stock}</span>
                            {product.sold_today > 0 && <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1 rounded">-{product.sold_today}</span>}
                        </div>

                        {/* BOTÓN REPONER (MÁS) */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button 
                                      onClick={() => handleOpenModal(product, 'restock')} 
                                      size="icon" 
                                      variant="outline" 
                                      className="h-8 w-8 rounded-full border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                    >
                                      <PlusCircle className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Ingresar Mercadería</p></TooltipContent>
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

      {/* --- MODAL PARA VENDER O REPONER --- */}
      {isModalOpen && selectedProduct && actionType && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header del Modal */}
            <div className={`p-4 flex justify-between items-center text-white ${
              actionType === 'sell' ? 'bg-red-600' : 'bg-emerald-600'
            }`}>
              <h3 className="font-bold text-lg flex items-center gap-2">
                {actionType === 'sell' ? (
                   <><ShoppingCart className="h-5 w-5" /> Registrar Salida</>
                ) : (
                   <><ArrowDownToLine className="h-5 w-5" /> Ingresar Stock</>
                )}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-5">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Producto Seleccionado</p>
                <p className="text-xl font-bold text-slate-800 leading-tight">{selectedProduct.name}</p>
                <div className="flex justify-between items-center mt-2 border-t border-slate-200 pt-2">
                    <p className="text-sm text-slate-500">Stock actual:</p>
                    <span className="font-bold text-lg text-slate-700">{selectedProduct.stock}</span>
                </div>
              </div>

              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {actionType === 'sell' ? 'Cantidad a vender' : 'Cantidad a ingresar'}
                  </label>
                  <Input 
                    type="number" 
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value)}
                    min="1"
                    max={actionType === 'sell' ? selectedProduct.stock : undefined}
                    className="text-lg font-bold h-12"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleConfirmAction()}
                  />
                </div>
                
                {/* Calculadora de Total ($) solo para ventas */}
                {actionType === 'sell' && (
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Total a Cobrar</label>
                    <div className="h-12 flex items-center px-3 bg-slate-100 rounded-md border border-slate-200 font-mono text-slate-600 font-bold text-lg">
                      ${(parseInt(quantityInput || '0') * selectedProduct.sale_price).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Avisos */}
              {actionType === 'sell' && parseInt(quantityInput) > selectedProduct.stock && (
                 <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded-md border border-red-100">
                    <AlertCircle className="h-4 w-4" />
                    <span>No puedes vender más del stock disponible.</span>
                 </div>
              )}
            </div>

            {/* Footer de Acciones */}
            <div className="p-4 bg-slate-50 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={processing}>
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmAction} 
                disabled={
                    processing || 
                    parseInt(quantityInput) <= 0 || 
                    (actionType === 'sell' && parseInt(quantityInput) > selectedProduct.stock)
                }
                className={`text-white min-w-[120px] ${
                    actionType === 'sell' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {processing ? (
                  <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ... </>
                ) : (
                  <> <Check className="mr-2 h-4 w-4" /> Confirmar </>
                )}
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}