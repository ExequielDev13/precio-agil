'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  LogOut, Package, Wallet, TrendingDown,
  Plus, Settings, FileText, Boxes
} from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: products } = await supabase
        .from('products')
        .select('sale_price, stock')
        .eq('user_id', user.id)

      if (products) {
        const totalVal = products.reduce((acc, curr) => acc + (curr.sale_price * curr.stock), 0)
        const lowStockCount = products.filter(p => p.stock <= 5).length
        setStats({ count: products.length, totalValue: totalVal, lowStock: lowStockCount })
      }
      setLoading(false)
    }
    initData()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
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
                  Precio<span className="text-blue-600">Ágil</span>
                </h1>
             </div>
             <Button onClick={handleLogout} variant="outline" size="sm" className="gap-2 text-slate-600 hover:text-red-600">
                <LogOut className="h-4 w-4" /> Salir
             </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* 1. TARJETAS KPI (Diseño de la imagen: Icono Circular Izquierda + Texto Derecha) */}
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
              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center self-start">
                 <Boxes className="h-4 w-4 text-blue-500" />
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
              <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center self-start">
                 <Wallet className="h-4 w-4 text-emerald-500" />
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
              <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center self-start">
                 <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 2. SECCIÓN AGREGAR MERCADERÍA (Separada como en la imagen) */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
           <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
             <Plus className="h-5 w-5" /> Agregar Mercadería
           </h3>
           <div className="flex flex-wrap gap-3">
              <AddProductModal userId={user?.id} />
              <BulkUpload userId={user?.id} />
           </div>
        </div>

        {/* 3. SECCIÓN GESTIÓN DE PRECIOS (Separada como en la imagen) */}
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
               <ProductList />
           </div>
        </div>

      </main>
    </div>
    </SubscriptionGuard>
  )
}