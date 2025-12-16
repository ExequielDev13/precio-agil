'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Papa from 'papaparse'
import { Button } from "@/components/ui/button"
import { Upload, FileSpreadsheet, Loader2, Download, HelpCircle, AlertTriangle } from 'lucide-react'
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useRouter } from 'next/navigation'

export function BulkUpload({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  // --- FUNCIÓN DE DESCARGA AJUSTADA PARA EXCEL ESPAÑOL (PUNTO Y COMA) ---
  const downloadTemplate = () => {
    // 1. Cabeceras separadas por PUNTO Y COMA (;)
    const headers = "COD_PROVEEDOR;MARCA;DESCRIPCION;RUBRO;SUBRUBRO;PROVEEDOR;COSTO;STOCK"
    
    // 2. Fila de Ejemplo también con PUNTO Y COMA
    const example = "REF-991;BOEHRINGER;PIPETA 10KG;FARMACIA;ANTIPULGAS;DISTRIBUIDORA X;1500;10"
    
    // 3. Unimos
    const csvContent = headers + "\n" + example
    
    // 4. Blob con BOM para acentos
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    // Cambiamos el nombre para indicar que es un CSV compatible
    link.setAttribute('download', 'modelo_inventario.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8", // Forzamos UTF-8 para leer bien acentos
      // NO definimos 'delimiter'. Dejamos que PapaParse detecte automáticamente 
      // si es (,) o (;) para que funcione en cualquier PC.
      complete: async (results) => {
        const rows = results.data as any[]
        
        if (rows.length === 0) {
            toast.error("El archivo está vacío o no se reconoció el formato.")
            setLoading(false)
            return
        }

        const normalizeRow = (row: any) => {
            const newRow: any = {};
            Object.keys(row).forEach(key => {
                // Quitamos espacios extra y convertimos a mayúsculas
                // Esto ayuda si el CSV trae comillas o espacios raros por el separador
                newRow[key.trim().toUpperCase()] = row[key];
            });
            return newRow;
        }

        try {
            let ignoredCount = 0;

            const productsToInsert = rows.map((rawRow) => {
                const row = normalizeRow(rawRow); 

                const supplierCode = row['COD_PROVEEDOR']?.toString().trim().toUpperCase() || ''
                const marca = row['MARCA']?.toString().trim().toUpperCase() || ''
                const descripcion = row['DESCRIPCION']?.toString().trim().toUpperCase() || ''
                const rubro = row['RUBRO']?.toString().trim().toUpperCase() || '' 
                const subrubro = row['SUBRUBRO']?.toString().trim().toUpperCase() || '' 
                const proveedor = row['PROVEEDOR']?.toString().trim().toUpperCase() || ''
                
                // Limpieza de números (soporta 1.500,00 o 1500.00)
                const cleanPrice = (val: any) => {
                   if (!val) return 0;
                   const str = val.toString();
                   // Si hay coma y punto, asumimos formato español (1.000,00) -> removemos puntos, cambiamos coma por punto
                   if (str.includes(',') && str.includes('.')) {
                      return parseFloat(str.replace(/\./g, '').replace(',', '.'));
                   }
                   // Si solo hay coma, asumimos decimal (150,50) -> cambiamos por punto
                   if (str.includes(',')) {
                      return parseFloat(str.replace(',', '.'));
                   }
                   return parseFloat(str) || 0;
                }
                
                const costo = cleanPrice(row['COSTO'])
                const stock = parseInt(row['STOCK']) || 0
                
                if (!descripcion && !supplierCode) {
                    ignoredCount++;
                    return null;
                }

                const margenDefault = 30 
                const precioVenta = costo * (1 + margenDefault / 100)
                const skuAuto = `COD-${Math.floor(1000 + Math.random() * 9000)}`
                const dbName = supplierCode || descripcion.slice(0, 50) || "SIN IDENTIFICADOR"

                return {
                    user_id: userId,
                    supplier_code: supplierCode,
                    sku: skuAuto,
                    name: dbName,
                    marca: marca,
                    descripcion: descripcion,
                    category: rubro,
                    subcategory: subrubro,
                    supplier: proveedor,
                    cost_price: costo,
                    sale_price: precioVenta,
                    margin_percentage: margenDefault,
                    stock: stock,
                    min_stock: 5,
                    sold_today: 0,
                    last_restock_date: new Date().toISOString()
                }
            }).filter(Boolean)

            if (productsToInsert.length === 0) {
                throw new Error("No se encontraron productos válidos. Verifica que las columnas estén separadas correctamente.")
            }

            const { error } = await supabase.from('products').insert(productsToInsert)

            if (error) throw error

            if (ignoredCount > 0) {
                toast.warning(`${productsToInsert.length} productos cargados. ${ignoredCount} ignorados.`)
            } else {
                toast.success(`¡Éxito! ${productsToInsert.length} productos importados.`)
            }
            
            setIsOpen(false)
            router.refresh()

        } catch (error: any) {
            console.error(error)
            toast.error(`Error: ${error.message}`)
        } finally {
            setLoading(false)
            event.target.value = ''
        }
      },
      error: (error) => {
        setLoading(false)
        toast.error(`Error al leer archivo: ${error.message}`)
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2 shadow-sm border border-slate-200">
          <FileSpreadsheet className="h-4 w-4 text-green-600" /> 
          Carga Masiva
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Importar Productos
          </DialogTitle>
          <DialogDescription>
            El sistema detectará automáticamente si usas Excel (punto y coma) o CSV estándar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm space-y-3">
                <div className="flex items-start gap-2">
                    <HelpCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-slate-600">
                        Columnas sugeridas: <b>COD_PROVEEDOR; MARCA; DESCRIPCION; RUBRO; COSTO; STOCK</b>.
                    </p>
                </div>
                
                <div className="flex items-start gap-2 text-orange-600 text-xs bg-orange-50 p-2 rounded">
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                    <p>
                        Se recomienda usar <b>Punto y Coma (;)</b> como separador, que es el estándar de Excel en español.
                    </p>
                </div>

                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={downloadTemplate} 
                    className="w-full gap-2 text-green-700 border-green-200 hover:bg-green-50 shadow-sm font-medium"
                >
                    <Download className="h-4 w-4" /> Descargar Modelo Excel (;)
                </Button>
            </div>

            <div className="flex justify-center">
                <label className={`
                    flex flex-col items-center justify-center w-full h-32 
                    border-2 border-dashed rounded-lg cursor-pointer 
                    transition-colors duration-200
                    ${loading ? 'bg-slate-100 border-slate-300' : 'bg-blue-50/50 border-blue-300 hover:bg-blue-50'}
                `}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {loading ? (
                            <>
                                <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-2" />
                                <p className="text-sm text-slate-500">Procesando...</p>
                            </>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 mb-3 text-blue-500" />
                                <p className="text-sm text-slate-500 font-semibold">Clic para subir archivo</p>
                                <p className="text-xs text-slate-400">Excel o CSV</p>
                            </>
                        )}
                    </div>
                    <input 
                        type="file" 
                        className="hidden" 
                        accept=".csv" 
                        onChange={handleFileUpload} 
                        disabled={loading}
                    />
                </label>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}