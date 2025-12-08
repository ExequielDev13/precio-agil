'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface Product {
  id: string
  name: string
  cost_price: number
  sale_price: number
  stock: number
}

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setProducts(data)
    } catch (error) {
      console.error('Error cargando productos:', error)
    } finally {
      setLoading(false)
    }
  }

  // --- NUEVA FUNCIÓN PARA BORRAR ---
  const handleDelete = async (id: string) => {
    const confirm = window.confirm("¿Estás seguro de que quieres borrar este producto?")
    if (!confirm) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Actualizamos la lista visualmente sin recargar toda la página
      setProducts(products.filter(product => product.id !== id))

    } catch (error) {
      alert("Error al borrar el producto")
      console.error(error)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  if (loading) return <p className="text-sm text-gray-500">Cargando inventario...</p>
  if (products.length === 0) return <div className="text-center p-6 border rounded bg-slate-50 text-slate-500">No hay productos registrados aún.</div>

  return (
    <div className="border rounded-lg bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Nombre</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Costo</TableHead>
            <TableHead className="text-right">Precio Venta</TableHead>
            <TableHead className="text-right w-[100px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.stock}</TableCell>
              <TableCell className="text-slate-500">${product.cost_price.toFixed(2)}</TableCell>
              <TableCell className="text-right font-bold text-green-600">
                ${product.sale_price.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="h-8 px-2 text-xs bg-red-100 text-red-600 hover:bg-red-200 border-0"
                  onClick={() => handleDelete(product.id)}
                >
                  Borrar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}