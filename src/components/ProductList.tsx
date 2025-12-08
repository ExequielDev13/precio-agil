'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface Product { id: string, name: string, cost_price: number, sale_price: number, stock: number }

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchProducts = async () => {
    try {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
      if (data) setProducts(data)
    } finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) {
        setProducts(products.filter(p => p.id !== id))
        toast.success("Producto eliminado")
    }
  }

  useEffect(() => { fetchProducts() }, [])

  const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="p-4 space-y-4">
      
      {/* BUSCADOR */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Buscar producto..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10 w-full bg-slate-50 border-slate-200" 
        />
      </div>

      <div className="rounded-md border border-slate-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold text-slate-700 pl-4">Producto</TableHead>
              <TableHead className="font-bold text-slate-700">Estado</TableHead>
              <TableHead className="text-right font-bold text-slate-700">Costo</TableHead>
              <TableHead className="text-right font-bold text-slate-700">Precio Venta</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
               <TableRow><TableCell colSpan={5} className="h-24 text-center">Cargando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
               <TableRow><TableCell colSpan={5} className="h-24 text-center text-slate-400">Sin resultados</TableCell></TableRow>
            ) : (
              filtered.map((product) => (
                <TableRow key={product.id} className="hover:bg-slate-50 border-b border-slate-100">
                  <TableCell className="font-medium text-slate-800 pl-4">{product.name}</TableCell>
                  <TableCell>
                    {product.stock <= 5 ? (
                      <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50 font-normal">
                        <AlertCircle className="w-3 h-3 mr-1"/> Bajo Stock
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-slate-200 text-slate-600 bg-slate-50 font-normal">
                         <CheckCircle2 className="w-3 h-3 mr-1"/> Normal
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-slate-500 font-mono">${product.cost_price.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold text-slate-900 font-mono">${product.sale_price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="text-slate-400 hover:text-red-600">
                       <Trash2 className="h-4 w-4" />
                    </Button>
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