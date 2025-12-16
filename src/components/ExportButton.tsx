'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Button } from "@/components/ui/button"
import { FileDown, Loader2 } from 'lucide-react'
import { toast } from "sonner"

export function ExportButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)

  const handleExportPDF = async () => {
    setLoading(true)
    try {
      // 1. Buscamos TODOS los productos del usuario
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        // Ordenamos por Código de Proveedor para facilitar el control de stock físico
        .order('supplier_code', { ascending: true })

      if (error) throw error

      if (!data || data.length === 0) {
        toast.warning("No tienes productos para exportar.")
        setLoading(false)
        return
      }

      // 2. Creamos el documento PDF
      const doc = new jsPDF()
      const fecha = new Date().toLocaleDateString('es-AR')
      const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

      // --- ENCABEZADO ---
      doc.setFontSize(18)
      doc.setTextColor(40)
      doc.text("Reporte de Inventario", 14, 22)
      
      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text(`Fecha: ${fecha} - ${hora}`, 14, 28)
      doc.text("Generado por: nexOstock", 14, 32)

      // 3. Definimos las Columnas (Ahora incluyen los datos nuevos)
      const tableColumn = [
        "Cód. Prov", 
        "Cód. Int",
        "Marca", 
        "Descripción / Detalle", 
        "Rubro", 
        "Stock", 
        "Precio Venta"
      ]

      // 4. Mapeamos los datos de la base a filas de la tabla
      const tableRows = data.map(product => {
        return [
          product.supplier_code || '-',              // Cód Proveedor
          product.sku || '-',                        // Cód Interno
          product.marca || '-',                      // Marca
          product.descripcion || '-',                // Descripción
          product.category || '-',                   // Rubro
          product.stock.toString(),                  // Stock
          `$ ${product.sale_price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` // Precio
        ]
      })

      // 5. Generamos la tabla con autoTable
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          valign: 'middle',
          overflow: 'linebreak' // Permite que el texto largo baje de renglón
        },
        headStyles: {
          fillColor: [41, 128, 185], // Azul Corporativo
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        // Ajustamos anchos de columna específicos
        columnStyles: {
          0: { cellWidth: 25, fontStyle: 'bold' }, // Cód Prov
          1: { cellWidth: 20 }, // Cód Int
          2: { cellWidth: 25 }, // Marca
          3: { cellWidth: 'auto' }, // Descripción (ocupa el resto)
          4: { cellWidth: 20 }, // Rubro
          5: { cellWidth: 15, halign: 'center', fontStyle: 'bold' }, // Stock
          6: { cellWidth: 25, halign: 'right' }   // Precio
        },
      })

      // 6. Descargar el archivo
      doc.save(`Inventario_${fecha.replace(/\//g, '-')}.pdf`)
      toast.success("PDF exportado correctamente")

    } catch (error: any) {
      console.error("Error exportando PDF:", error)
      toast.error("Hubo un error al generar el reporte.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleExportPDF} 
      disabled={loading}
      className="gap-2 text-red-700 border-red-200 hover:bg-red-50 shadow-sm"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      Exportar PDF
    </Button>
  )
}