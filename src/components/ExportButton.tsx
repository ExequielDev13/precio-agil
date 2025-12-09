'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Button } from "@/components/ui/button"
import { FileDown } from 'lucide-react'

export function ExportButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      // 1. Buscamos TODOS los datos del producto
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('category', { ascending: true }) 
        .order('name', { ascending: true })

      if (!products || products.length === 0) {
        alert("No hay productos para exportar.")
        setLoading(false)
        return
      }

      // 2. Configuración del PDF
      const doc = new jsPDF() 
      
      // Título y Fecha
      doc.setFontSize(18)
      doc.text("Reporte de Inventario y Precios", 14, 20)
      
      doc.setFontSize(10)
      doc.text(`Generado el: ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`, 14, 28)

      // 3. Definir las Columnas (INCLUYE MARCA Y DESCRIPCION)
      const tableColumn = ["Producto", "Marca", "Rubro / Sub", "Descripción", "Stock", "Precio"]

      // 4. Mapear los datos a filas
      const tableRows = products.map(p => {
        const rubroCompleto = p.category 
          ? `${p.category} ${p.subcategory ? '> ' + p.subcategory : ''}` 
          : '-'

        return [
          p.name,
          p.marca || '-',           // <--- NUEVO
          rubroCompleto,
          p.descripcion || '-',     // <--- NUEVO
          p.stock.toString(),
          `$${p.sale_price.toFixed(2)}`
        ]
      })

      // 5. Generar la Tabla con AutoTable
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 8 }, 
        columnStyles: {
          0: { cellWidth: 40 }, // Producto
          1: { cellWidth: 25 }, // Marca
          2: { cellWidth: 35 }, // Rubro
          3: { cellWidth: 'auto' }, // Descripción (Automático para usar el espacio sobrante)
          4: { cellWidth: 15, halign: 'center' }, // Stock
          5: { cellWidth: 20, halign: 'right' }   // Precio
        }
      })

      doc.save("inventario_completo.pdf")

    } catch (error: any) {
      alert("Error al generar PDF: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
        onClick={handleExport} 
        disabled={loading}
        variant="outline"
        className="bg-white hover:bg-slate-50 text-slate-700 border-slate-300 gap-2 font-medium"
    >
      <FileDown className="h-4 w-4" />
      {loading ? "Generando..." : "Descargar Lista PDF"}
    </Button>
  )
}