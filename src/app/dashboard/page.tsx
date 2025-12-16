'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  LogOut, Package, Wallet, TrendingDown,
  Plus, Settings, FileText, Boxes,
  Search, MinusCircle, AlertCircle, CheckCircle2 // <--- Nuevos Iconos
} from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input" // <--- Asegúrate de tener este componente, si no, usa un input normal
import { Skeleton } from "@/components/ui/skeleton"

import { ProductList } from '@/components/ProductList'
import { AddProductModal } from '@/components/AddProductModal'
import { BulkUpload } from '@/components/BulkUpload'
import { PriceUpdater } from '@/components/PriceUpdater'
import { ExportButton } from '@/components/ExportButton'
import { SubscriptionGuard } from '@/components/SubscriptionGuard'

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({ count: 0, totalValue: 0, lowStock: 0 })

  // --- ESTADOS PARA LA SALIDA RÁPIDA DE STOCK ---
  const [searchQuery, setSearchQuery] = useState('')
  const [foundProduct, setFoundProduct] = useState<any>(null)
  const [amountToSubtract, setAmountToSubtract] = useState('')
  const [widgetLoading, setWidgetLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Función para cargar estadísticas
  const fetchStats = async (userId: string) => {
    const { data: products } = await supabase
      .from('products')
      .select('sale_price, stock')
      .eq('user_id', userId)

    if (products) {
      const totalVal = products.reduce((acc, curr) => acc + (curr.sale_price * curr.stock), 0)
      const lowStockCount = products.filter(p => p.stock <= 5).length
      setStats({ count: products.length, totalValue: totalVal, lowStock: lowStockCount })
    }
  }

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      await fetchStats(user.id)
      setLoading(false)
    }
    initData()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // --- LÓGICA DEL WIDGET DE RESTA ---
  const handleSearchProduct = async () => {
    if (!searchQuery.trim() || !user) return
    setWidgetLoading(true)
    setFeedback(null)
    setFoundProduct(null)

    try {
      // Busca por nombre (case insensitive)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .ilike('name', `%${searchQuery}%`)
        .limit(1)
        .single()

      if (error || !data) {
        setFeedback({ type: 'error', text: 'Producto no encontrado.' })
      } else {
        setFoundProduct(data)
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Error al buscar.' })
    } finally {
      setWidgetLoading(false)
    }
  }

  const handleSubtractStock = async () => {
    if (!foundProduct || !amountToSubtract) return
    const amount = parseInt(amountToSubtract)

    if (isNaN(amount) || amount <= 0) {
      setFeedback({ type: 'error', text: 'Ingresa una cantidad válida.' })
      return
    }

    if (amount > foundProduct.stock) {
      setFeedback({ type: 'error', text: `Stock insuficiente. Solo hay ${foundProduct.stock}.` })
      return
    }

    setWidgetLoading(true)
    try {
      const newStock = foundProduct.stock - amount
      
      const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', foundProduct.id)

      if (error) throw error

      // Éxito: Actualizamos UI local y Stats globales
      setFoundProduct({ ...foundProduct, stock: newStock })
      setFeedback({ type: 'success', text: `Se retiraron ${amount} unidades.` })
      setAmountToSubtract('')
      await fetchStats(user.id) // Actualizamos las tarjetas de arriba
      
      // Opcional: Recargar la lista de productos si es necesario, 
      // pero requeriría pasar un trigger al componente ProductList.
      
    } catch (err) {
      console.error(err)
      setFeedback({ type: 'error', text: 'Error al actualizar stock.' })
    } finally {
      setWidgetLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500">Cargando...</div>

  return (
    <SubscriptionGuard>
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <div className="bg-slate-100 p-2 rounded-lg">
                    <Package className="h-5 w-5 text-slate-700" />
                </div>
                <h1 className="text-xl font-bold text-slate-800">
                  nexO<span className="text-blue-600">stock</span>
                </h1>
             </div>
             <Button onClick={handleLogout} variant="outline" size="sm" className="gap-2 text-slate-600 hover:text-red-600">
                <LogOut className="h-4 w-4" /> Salir
             </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* 1. TARJETAS KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tarjeta AZUL */}
          <Card className="border-b-4 border-b-blue-500 shadow-sm bg-white rounded-xl overflow-hidden">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-md flex-shrink-0">
                 <Boxes className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <p className="text-slate-500 font-bold text-xs uppercase mb-1">INVENTARIO TOTAL</p>
                <h3 className="text-3xl font-bold text-slate-800 leading-none">{stats.count}</h3>
                <p className="text-slate-400 text-xs mt-1">Productos registrados</p>
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta VERDE */}
          <Card className="border-b-4 border-b-emerald-500 shadow-sm bg-white rounded-xl overflow-hidden">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md flex-shrink-0">
                 <Wallet className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <p className="text-slate-500 font-bold text-xs uppercase mb-1">VALOR ESTIMADO</p>
                <h3 className="text-3xl font-bold text-slate-800 leading-none">
                  ${stats.totalValue.toLocaleString('es-AR')}
                </h3>
                <p className="text-slate-400 text-xs mt-1">Capital en mercadería</p>
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta ROJA */}
          <Card className="border-b-4 border-b-red-500 shadow-sm bg-white rounded-xl overflow-hidden">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-red-500 flex items-center justify-center text-white shadow-md flex-shrink-0">
                 <TrendingDown className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <p className="text-slate-500 font-bold text-xs uppercase mb-1">STOCK BAJO</p>
                <h3 className="text-3xl font-bold text-slate-800 leading-none">{stats.lowStock}</h3>
                <p className="text-slate-400 text-xs mt-1">Requieren reposición</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- NUEVA SECCIÓN: SALIDA RÁPIDA DE STOCK --- */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-orange-200 bg-orange-50/30">
           <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
             <MinusCircle className="h-5 w-5 text-orange-600" /> Salida Rápida de Stock
           </h3>
           
           <div className="flex flex-col md:flex-row gap-4 items-start">
              {/* Buscador */}
              <div className="flex gap-2 w-full md:w-1/3">
                <Input 
                  placeholder="Buscar producto..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchProduct()}
                />
                <Button onClick={handleSearchProduct} disabled={widgetLoading} variant="secondary">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {/* Área de Acción (Solo aparece si se encuentra el producto) */}
              {foundProduct && (
                <div className="flex-1 flex flex-col md:flex-row gap-4 w-full animate-in fade-in slide-in-from-left-4 items-center bg-white p-3 rounded-lg border border-slate-200">
                   <div className="flex-1">
                      <p className="text-xs text-slate-500 font-bold uppercase">Producto Seleccionado</p>
                      <p className="font-bold text-slate-800 text-lg">{foundProduct.name}</p>
                      <p className="text-sm text-slate-600">Stock Actual: <span className="font-bold text-blue-600">{foundProduct.stock}</span></p>
                   </div>
                   
                   <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        placeholder="Cant." 
                        className="w-24" 
                        min="1"
                        value={amountToSubtract}
                        onChange={(e) => setAmountToSubtract(e.target.value)}
                      />
                      <Button onClick={handleSubtractStock} disabled={widgetLoading} className="bg-orange-600 hover:bg-orange-700 text-white">
                        Restar
                      </Button>
                   </div>
                </div>
              )}
           </div>

           {/* Mensajes de Feedback */}
           {feedback && (
             <div className={`mt-3 text-sm flex items-center gap-2 font-medium ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4"/> : <AlertCircle className="h-4 w-4"/>}
                {feedback.text}
             </div>
           )}
        </div>

        {/* 2. SECCIÓN AGREGAR MERCADERÍA */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
           <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
             <Plus className="h-5 w-5" /> Agregar Mercadería
           </h3>
           <div className="flex flex-wrap gap-3">
              <AddProductModal userId={user?.id} />
              <BulkUpload userId={user?.id} />
           </div>
        </div>

        {/* 3. SECCIÓN GESTIÓN DE PRECIOS */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
           <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
             <Settings className="h-5 w-5" /> Gestión de Precios
           </h3>
           <div className="flex flex-wrap gap-3">
              <PriceUpdater userId={user?.id} />
              <ExportButton userId={user?.id} />
           </div>
        </div>

        {/* 4. TABLA DE INVENTARIO */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="px-6 py-4 border-b border-slate-100 bg-white">
             <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <FileText className="h-5 w-5" /> Inventario Detallado
             </h2>
           </div>
           <div className="p-2">
               {/* Pasamos un key para forzar recarga si cambia el inventario, opcional */}
               <ProductList key={stats.totalValue} />
           </div>
        </div>

      </main>
    </div>
    </SubscriptionGuard>
  )
}