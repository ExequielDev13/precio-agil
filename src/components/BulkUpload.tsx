'use client'
import { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function BulkUpload({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const bstr = event.target?.result
        const workbook = XLSX.read(bstr, { type: 'binary' })
        const wsname = workbook.SheetNames[0]
        const ws = workbook.Sheets[wsname]
        
        // 1. Leemos TODO como una matriz simple (Array de Arrays)
        // Ejemplo: [ ["Nombre", "Costo"], ["Martillo", 100] ]
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]

        if (data.length < 2) {
            alert("El archivo parece estar vacío o no tiene datos.")
            setLoading(false)
            return
        }

        // 2. Analizamos la Fila 0 para encontrar en qué columna está cada dato
        const headerRow = data[0].map((cell: any) => cell.toString().toLowerCase().trim())
        
        // Buscamos el índice (posición 0, 1, 2...) de cada columna clave
        const nameIdx = headerRow.findIndex((h) => h.includes('nombre') || h.includes('producto') || h.includes('name'))
        const costIdx = headerRow.findIndex((h) => h.includes('costo') || h.includes('precio') || h.includes('cost'))
        const marginIdx = headerRow.findIndex((h) => h.includes('margen') || h.includes('ganancia') || h.includes('margin'))
        const stockIdx = headerRow.findIndex((h) => h.includes('stock') || h.includes('cantidad') || h.includes('cant'))
        const skuIdx = headerRow.findIndex((h) => h.includes('sku') || h.includes('codigo') || h.includes('código'))

        // Validación: Si no encontramos la columna de Costo o Nombre, avisamos
        if (nameIdx === -1 || costIdx === -1) {
            alert(`Error: No encontré las columnas 'Nombre' ni 'Costo'. \nColumnas detectadas: ${headerRow.join(", ")}`)
            setLoading(false)
            return
        }

        // 3. Procesamos las filas de datos (empezamos desde la fila 1, saltando los títulos)
        const productsToInsert = data.slice(1).map((row) => {
            // Si la fila está vacía, la saltamos
            if (!row[nameIdx] && !row[costIdx]) return null

            const cost = parseFloat(row[costIdx] || 0)
            // Si no hay margen, usamos 30% por defecto
            const margin = marginIdx !== -1 ? parseFloat(row[marginIdx] || 30) : 30
            const stock = stockIdx !== -1 ? parseInt(row[stockIdx] || 0) : 0
            const sku = skuIdx !== -1 ? (row[skuIdx] || '') : ''
            
            const salePrice = cost * (1 + margin / 100)
            
            return {
                user_id: userId,
                name: row[nameIdx] || 'Sin Nombre',
                cost_price: cost,
                stock: stock,
                sale_price: salePrice,
                sku: sku.toString()
            }
        }).filter(Boolean) // Eliminamos filas nulas

        // 4. Enviamos a Supabase
        const { error } = await supabase.from('products').insert(productsToInsert)

        if (error) throw error

        alert(`¡Éxito! Se cargaron ${productsToInsert.length} productos.`)
        setOpen(false)
        router.refresh()
        window.location.reload()

      } catch (error) {
        console.error("Error:", error)
        alert("Ocurrió un error inesperado al procesar el Excel.")
      } finally {
        setLoading(false)
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="bg-green-600 hover:bg-green-700 text-white">
          📂 Subir Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Carga Masiva</DialogTitle>
          <DialogDescription>
            El sistema buscará automáticamente las columnas: <b>Nombre, Costo, Margen, Stock</b>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="file">Seleccionar archivo</Label>
            <Input 
                id="file" 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleFileUpload}
                disabled={loading}
            />
          </div>
          {loading && <p className="text-sm text-slate-500 text-center">Leyendo archivo...</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}