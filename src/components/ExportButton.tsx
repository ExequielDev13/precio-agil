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
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true })

      if (!products || products.length === 0) {
        alert("No hay productos para exportar.")
        setLoading(false)
        return
      }

      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.text("Lista de Precios", 14, 20)
      doc.setFontSize(10)
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 28)

      const rows = products.map(p => [p.name, `$${p.sale_price.toFixed(2)}`])
      
      autoTable(doc, {
        head: [["Producto", "Precio"]],
        body: rows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }
      })

      doc.save("lista_precios.pdf")
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
      {loading ? "Generando..." : "Descargar PDF"}
    </Button>
  )
}