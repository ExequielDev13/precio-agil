'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Button } from "@/components/ui/button"

export function ExportButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      // 1. Buscamos los datos frescos
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId) // Solo tus productos
        .order('name', { ascending: true }) // Ordenados alfabéticamente

      if (error) throw error
      if (!products || products.length === 0) {
        alert("No hay productos para exportar.")
        return
      }

      // 2. Creamos el PDF
      const doc = new jsPDF()

      // Título del negocio o reporte
      doc.setFontSize(18)
      doc.text("Lista de Precios", 14, 20)
      
      doc.setFontSize(10)
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 28)

      // 3. Generamos la tabla
      const tableColumn = ["Producto", "Precio"]
      const tableRows: any[] = []

      products.forEach(product => {
        const productData = [
          product.name,
          `$${product.sale_price.toFixed(2)}` // Formato moneda
        ]
        tableRows.push(productData)
      })

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid', // Estilo: 'striped', 'grid', 'plain'
        styles: { fontSize: 12 },
        headStyles: { fillColor: [22, 163, 74] } // Color verde encabezado
      })

      // 4. Descargar
      doc.save("lista-de-precios.pdf")

    } catch (error) {
      console.error(error)
      alert("Error al generar el PDF")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
        onClick={handleExport} 
        disabled={loading}
        className="bg-slate-800 hover:bg-slate-900 text-white w-full"
    >
      {loading ? "Generando..." : "📄 Descargar Lista PDF"}
    </Button>
  )
}