'use client'
import { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Upload } from 'lucide-react'

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
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]

        if (data.length < 2) {
            alert("El archivo está vacío.")
            setLoading(false)
            return
        }

        const headerRow = data[0].map((cell: any) => cell.toString().toLowerCase().trim())
        const nameIdx = headerRow.findIndex((h) => h.includes('nombre') || h.includes('producto'))
        const costIdx = headerRow.findIndex((h) => h.includes('costo') || h.includes('precio'))
        const marginIdx = headerRow.findIndex((h) => h.includes('margen'))
        const stockIdx = headerRow.findIndex((h) => h.includes('stock'))

        if (nameIdx === -1 || costIdx === -1) {
            alert("No se encontraron las columnas 'Nombre' y 'Costo'.")
            setLoading(false)
            return
        }

        const productsToInsert = data.slice(1).map((row) => {
            if (!row[nameIdx] && !row[costIdx]) return null
            
            // 1. Lógica de Mayúscula Inicial para Excel
            let rawName = (row[nameIdx] || 'Sin Nombre').toString().trim()
            const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1)

            const cost = parseFloat(row[costIdx] || 0)
            const margin = marginIdx !== -1 ? parseFloat(row[marginIdx] || 30) : 30
            const stock = stockIdx !== -1 ? parseInt(row[stockIdx] || 0) : 0
            const salePrice = cost * (1 + margin / 100)
            
            return {
                user_id: userId,
                name: formattedName, // Nombre corregido
                cost_price: cost,
                stock: stock,
                sale_price: salePrice,
                sku: ''
            }
        }).filter(Boolean)

        const { error } = await supabase.from('products').insert(productsToInsert)
        if (error) throw error

        alert(`¡Éxito! Se cargaron ${productsToInsert.length} productos.`)
        setOpen(false)
        router.refresh()
        window.location.reload()

      } catch (error: any) {
        alert("Error al procesar el archivo: " + error.message)
      } finally {
        setLoading(false)
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm font-medium">
          <Upload className="h-4 w-4" /> Subir Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Carga Masiva</DialogTitle>
          <DialogDescription>Selecciona un archivo .xlsx</DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <Label htmlFor="file">Archivo Excel</Label>
            <Input id="file" type="file" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={loading} className="mt-2" />
        </div>
      </DialogContent>
    </Dialog>
  )
}