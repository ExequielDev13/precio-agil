'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { ProductList } from '@/components/ProductList'
import { AddProductModal } from '@/components/AddProductModal' // Importamos el modal
import { BulkUpload } from '@/components/BulkUpload'
import { PriceUpdater } from '@/components/PriceUpdater'
import { ExportButton } from '@/components/ExportButton'

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null) // Guardamos todo el objeto usuario, no solo el email

  useEffect(() => {
    const checkUser = async () => {
      // 1. Preguntamos a Supabase si hay usuario
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // 2. Si NO hay usuario, lo enviamos al login
        router.push('/login')
      } else {
        // 3. Si SÍ hay, guardamos el usuario completo
        setUser(user)
        setLoading(false)
      }
    }
    checkUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Mientras verifica, mostramos algo simple
  if (loading) return <div className="p-10">Cargando panel...</div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Panel de Control</h1>
          {/* Usamos user?.email con el signo de pregunta por seguridad */}
          <p className="text-sm text-gray-500">Bienvenido, {user?.email}</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Cerrar Sesión
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Tarjeta de Resumen 1 */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-slate-500">Total Productos</h3>
          <p className="text-2xl font-bold">--</p>
        </div>
        
        {/* Tarjeta de Resumen 2 */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-slate-500">Listas de Precios</h3>
          <p className="text-2xl font-bold">0</p>
        </div>

        {/* Tarjeta 3: AQUÍ COLOCAMOS EL BOTÓN DE NUEVO PRODUCTO */}
       <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border rounded-lg gap-3">
           {user && (
             <>
               {/* Fila 1: Botones de Gestión */}
               <div className="flex gap-2 w-full">
                 <AddProductModal userId={user.id} />
                 <BulkUpload userId={user.id} />
               </div>
               
               {/* Fila 2: Botón de Precios */}
               <div className="w-full">
                 <PriceUpdater userId={user.id} />
               </div>

               {/* Fila 3: Botón de PDF (NUEVO) */}
               <div className="w-full pt-2 border-t border-slate-200 mt-1">
                 <ExportButton userId={user.id} />
               </div>
             </>
           )}
        </div>
        </div>
      
      {/* Lista de productos */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Mis Productos</h2>
        <ProductList />
      </div>
    </div>
  )
}   