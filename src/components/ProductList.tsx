'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Search, Trash2, PlusCircle, MinusCircle, 
  Tag, X, ShoppingCart, ArrowDownToLine, 
  Settings2, ArrowUp, ArrowDown, Eye, EyeOff,
  Pencil // <--- Nuevo icono
} from 'lucide-react'
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { EditProductModal } from '@/components/EditProductModal' // <--- IMPORTAMOS EL MODAL

interface Product { 
  id: string, 
  sku: string | null,
  supplier_code: string | null,
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
  sold_today: number
}

interface ColumnConfig { id: string; label: string; visible: boolean }

type ActionType = 'sell' | 'restock' | null

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Configuración de Columnas
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'supplier_code', label: 'Cód. Proveedor', visible: true },
    { id: 'sku', label: 'Cód. Interno', visible: true },
    { id: 'details', label: 'Detalles', visible: true },
    { id: 'stock', label: 'Stock', visible: true },
    { id: 'price', label: 'Precio', visible: true },
    { id: 'actions', label: 'Acciones', visible: true }
  ])

  // --- MODALES ---
  const [isActionModalOpen, setIsActionModalOpen] = useState(false) // Venta/Stock
  const [productToAction, setProductToAction] = useState<Product | null>(null)
  const [actionType, setActionType] = useState<ActionType>(null)
  const [quantityInput, setQuantityInput] = useState<string>('1')
  const [processing, setProcessing] = useState(false)

  // Estado para Edición
  const [productToEdit, setProductToEdit] = useState<Product | null>(null) // <--- Estado para editar

  const fetchProducts = async () => {
    try {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
      if (data) setProducts(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [])

  // --- LÓGICA DE COLUMNAS ---
  const toggleColumn = (id: string) => {
    setColumns(prev => prev.map(col => col.id === id ? { ...col, visible: !col.visible } : col))
  }
  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const newCols = [...columns]
    if (direction === 'up' && index > 0) {
      [newCols[index], newCols[index - 1]] = [newCols[index - 1], newCols[index]]
    } else if (direction === 'down' && index < newCols.length - 1) {
      [newCols[index], newCols[index + 1]] = [newCols[index + 1], newCols[index]]
    }
    setColumns(newCols)
  }

  // --- RENDERIZADO DE CELDAS ---
  const renderCellContent = (colId: string, product: Product) => {
    switch (colId) {
      case 'supplier_code':
        return (
          <>
            {product.supplier_code ? <div className="font-bold text-slate-800 text-lg">{product.supplier_code}</div> : <span className="text-slate-300 italic">--</span>}
            {product.supplier && <div className="text-xs text-slate-500 font-bold mt-1">{product.supplier}</div>}
          </>
        )
      case 'sku':
        return product.sku ? <Badge variant="outline" className="font-mono text-blue-700 bg-blue-50 border-blue-200">{product.sku}</Badge> : <span className="text-slate-300">--</span>
      
      case 'details':
        return (
          <div className="flex flex-col gap-1 min-w-[200px]">
            {product.descripcion ? <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-normal uppercase">{product.descripcion}</p> : <span className="text-slate-300 italic">Sin descripción</span>}
            <div className="flex flex-wrap gap-2 mt-1">
              {product.marca && <Badge variant="secondary" className="text-slate-600 bg-slate-100">{product.marca}</Badge>}
              {product.category && <Badge variant="outline" className="text-slate-500 font-normal"><Tag className="h-3 w-3 mr-1"/>{product.category}</Badge>}
            </div>
          </div>
        )
      case 'stock':
        return (
          <div className="flex items-center justify-center gap-2">
            <TooltipProvider><Tooltip><TooltipTrigger asChild>
              <Button onClick={() => openActionModal(product, 'sell')} size="icon" variant="outline" className="h-7 w-7 rounded-full border-red-200 text-red-600 hover:bg-red-50"><MinusCircle className="h-4 w-4" /></Button>
            </TooltipTrigger><TooltipContent>Vender</TooltipContent></Tooltip></TooltipProvider>
            <span className={`font-mono font-bold w-8 text-center text-lg ${product.stock <= 5 ? 'text-red-600' : 'text-slate-700'}`}>{product.stock}</span>
            <TooltipProvider><Tooltip><TooltipTrigger asChild>
              <Button onClick={() => openActionModal(product, 'restock')} size="icon" variant="outline" className="h-7 w-7 rounded-full border-emerald-200 text-emerald-600 hover:bg-emerald-50"><PlusCircle className="h-4 w-4" /></Button>
            </TooltipTrigger><TooltipContent>Reponer</TooltipContent></Tooltip></TooltipProvider>
          </div>
        )
      case 'price':
        return (
          <div className="text-right">
            <div className="font-bold text-slate-900 font-mono text-lg">${product.sale_price.toLocaleString()}</div>
            <div className="text-xs text-slate-400">Costo: ${product.cost_price.toLocaleString()}</div>
          </div>
        )
      case 'actions':
        return (
          <div className="text-right flex justify-end gap-1">
             {/* BOTÓN EDITAR */}
             <TooltipProvider><Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setProductToEdit(product)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                    <Pencil className="h-4 w-4" />
                </Button>
             </TooltipTrigger><TooltipContent>Editar Ficha</TooltipContent></Tooltip></TooltipProvider>

             {/* BOTÓN ELIMINAR */}
             <TooltipProvider><Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="text-slate-300 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                </Button>
             </TooltipTrigger><TooltipContent>Eliminar</TooltipContent></Tooltip></TooltipProvider>
          </div>
        )
      default: return null
    }
  }

  // --- SELECCION ---
  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(filtered.map(p => p.id))
    else setSelectedIds([])
  }
  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) setSelectedIds(prev => [...prev, id])
    else setSelectedIds(prev => prev.filter(item => item !== id))
  }
  const handleBulkDelete = async () => {
    if (!confirm(`⚠️ ¿Eliminar ${selectedIds.length} productos?`)) return
    const { error } = await supabase.from('products').delete().in('id', selectedIds)
    if (!error) {
      setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)))
      setSelectedIds([])
      toast.success("Eliminados correctamente")
    }
  }
  const handleDelete = async (id: string) => {
    if(!confirm("¿Borrar definitivamente?")) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) {
        setProducts(products.filter(p => p.id !== id))
        toast.success("Producto eliminado")
    }
  }

  // --- MODAL ACCIONES (VENTA/STOCK) ---
  const openActionModal = (product: Product, type: ActionType) => {
    setProductToAction(product)
    setActionType(type)
    setQuantityInput('1')
    setIsActionModalOpen(true)
  }
  const handleConfirmAction = async () => {
    if (!productToAction || !actionType) return
    const qty = parseInt(quantityInput)
    if (isNaN(qty) || qty <= 0) { toast.error("Cantidad inválida"); return }
    if (actionType === 'sell' && qty > productToAction.stock) { toast.error("Stock insuficiente"); return }
    setProcessing(true)
    try {
        let updates: Partial<Product> = {}
        let newStock = 0
        if (actionType === 'sell') {
            newStock = productToAction.stock - qty
            updates = { stock: newStock, sold_today: (productToAction.sold_today || 0) + qty }
            toast.success(`Venta de ${qty} registrada`)
        } else {
            newStock = productToAction.stock + qty
            updates = { stock: newStock }
            toast.success(`Ingresaron ${qty} unidades`)
        }
        setProducts(prev => prev.map(p => p.id === productToAction.id ? { ...p, ...updates } : p))
        await supabase.from('products').update(updates).eq('id', productToAction.id)
        setIsActionModalOpen(false)
        setProductToAction(null)
    } catch (err:any) { toast.error(err.message) } 
    finally { setProcessing(false) }
  }

  const filtered = products.filter(p => {
    const s = searchTerm.toLowerCase()
    return (
      (p.sku && p.sku.toLowerCase().includes(s)) ||
      (p.supplier_code && p.supplier_code.toLowerCase().includes(s)) ||
      (p.supplier && p.supplier.toLowerCase().includes(s)) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(s)) ||
      (p.marca && p.marca.toLowerCase().includes(s))
    )
  })

  return (
    <div className="p-6 space-y-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-2 w-full max-w-xl">
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-11 bg-slate-50 border-slate-200" />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 border-slate-300"><Settings2 className="h-5 w-5 text-slate-600" /></Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3 bg-white" align="end">
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-slate-800 mb-2 border-b pb-1">Configurar Columnas</h4>
                  {columns.map((col, idx) => (
                    <div key={col.id} className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded border border-slate-100">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleColumn(col.id)} className="text-slate-500 hover:text-blue-600">
                           {col.visible ? <Eye className="h-4 w-4 text-blue-600" /> : <EyeOff className="h-4 w-4 text-slate-300" />}
                        </button>
                        <span className={col.visible ? 'text-slate-700 font-medium' : 'text-slate-400'}>{col.label}</span>
                      </div>
                      <div className="flex gap-1">
                        <button disabled={idx === 0} onClick={() => moveColumn(idx, 'up')} className="hover:bg-slate-200 p-1 rounded disabled:opacity-20"><ArrowUp className="h-3 w-3"/></button>
                        <button disabled={idx === columns.length - 1} onClick={() => moveColumn(idx, 'down')} className="hover:bg-slate-200 p-1 rounded disabled:opacity-20"><ArrowDown className="h-3 w-3"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
        </div>
        {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete}><Trash2 className="h-4 w-4 mr-2" /> Eliminar ({selectedIds.length})</Button>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-100">
            <TableRow>
              <TableHead className="w-[40px] pl-4"><Checkbox checked={filtered.length > 0 && selectedIds.length === filtered.length} onCheckedChange={(c) => handleSelectAll(!!c)} /></TableHead>
              {columns.map((col) => (
                col.visible && (
                  <TableHead key={col.id} className={`font-bold text-slate-900 ${col.id === 'price' || col.id === 'actions' ? 'text-right' : 'text-left'} ${col.id === 'stock' ? 'text-center' : ''}`}>
                    {col.label.toUpperCase()}
                  </TableHead>
                )
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={columns.filter(c=>c.visible).length + 1} className="h-32 text-center text-slate-400">Cargando...</TableCell></TableRow> 
            : filtered.length === 0 ? <TableRow><TableCell colSpan={columns.filter(c=>c.visible).length + 1} className="h-40 text-center text-slate-400">Sin resultados</TableCell></TableRow> 
            : filtered.map((product) => (
                <TableRow key={product.id} className={`hover:bg-slate-50 ${selectedIds.includes(product.id) ? 'bg-blue-50/50' : ''}`}>
                  <TableCell className="pl-4 align-top pt-5"><Checkbox checked={selectedIds.includes(product.id)} onCheckedChange={(c) => handleSelectOne(product.id, !!c)} /></TableCell>
                  {columns.map((col) => (col.visible && <TableCell key={col.id} className="py-4 align-top">{renderCellContent(col.id, product)}</TableCell>))}
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </div>
      
      {/* MODAL ACCIONES (VENTA/STOCK) */}
      {isActionModalOpen && productToAction && actionType && (
         <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
              <div className={`p-4 flex justify-between items-center text-white ${actionType === 'sell' ? 'bg-red-600' : 'bg-emerald-600'}`}>
                 <h3 className="font-bold text-lg flex items-center gap-2">{actionType === 'sell' ? <><ShoppingCart className="h-5 w-5"/> Registrar Salida</> : <><ArrowDownToLine className="h-5 w-5"/> Ingresar Stock</>}</h3>
                 <button onClick={() => setIsActionModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><X className="h-5 w-5"/></button>
              </div>
              <div className="p-6 space-y-5">
                 <div className="bg-slate-50 p-3 rounded-lg border">
                    <p className="text-xs text-slate-500 font-bold uppercase">Producto</p>
                    <p className="text-xl font-bold text-slate-800">{productToAction.supplier_code || productToAction.descripcion}</p>
                    <p className="text-sm text-slate-500 mt-1">Stock: <span className="font-bold text-slate-800">{productToAction.stock}</span></p>
                 </div>
                 <div className="flex gap-4">
                    <div className="flex-1">
                       <label className="text-sm font-medium">Cantidad</label>
                       <Input type="number" value={quantityInput} onChange={e=>setQuantityInput(e.target.value)} min="1" className="text-lg font-bold" autoFocus onKeyDown={e=>e.key==='Enter' && handleConfirmAction()}/>
                    </div>
                    {actionType === 'sell' && (
                       <div className="flex-1">
                          <label className="text-sm font-medium">Total ($)</label>
                          <div className="h-10 flex items-center px-3 bg-slate-100 rounded border font-mono font-bold">${(parseInt(quantityInput||'0')*productToAction.sale_price).toLocaleString()}</div>
                       </div>
                    )}
                 </div>
                 <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={()=>setIsActionModalOpen(false)}>Cancelar</Button>
                    <Button onClick={handleConfirmAction} disabled={processing} className={actionType==='sell'?'bg-red-600 hover:bg-red-700':'bg-emerald-600 hover:bg-emerald-700'}>{processing ? '...' : 'Confirmar'}</Button>
                 </div>
              </div>
           </div>
         </div>
      )}

      {/* MODAL DE EDICIÓN */}
      <EditProductModal 
        product={productToEdit} 
        isOpen={!!productToEdit} 
        onClose={() => setProductToEdit(null)}
        onUpdate={fetchProducts} // Cuando edita, recarga la lista
      />

    </div>
  )
}