'use client'

import { useState } from 'react'
import { UserProfile } from "@/components/ui/UserProfile"
import { Menu, X } from 'lucide-react'
import { Button } from "@/components/ui/button"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-slate-50 relative">
      
      {/* --- HEADER MÓVIL (Barra superior) --- */}
      {/* Usamos z-20 para que esté sobre el contenido normal, pero debajo del overlay */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <span className="font-bold text-blue-600 text-lg">PrecioÁgil 🐶</span>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* --- OVERLAY (Fondo Oscuro) --- */}
      {/* USAMOS z-[90] PARA ASEGURARNOS QUE CUBRA EL HEADER (que es z-20) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[90] md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- BARRA LATERAL (Sidebar) --- */}
      {/* USAMOS z-[100] PARA QUE ESTÉ POR ENCIMA DE ABSOLUTAMENTE TODO */}
      <aside className={`
        fixed inset-y-0 left-0 z-[100] w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl
        md:relative md:translate-x-0 md:z-0 md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        <div>
          {/* Encabezado del Menú */}
          <div className="mb-6 flex justify-between items-center">
            {/* Título Desktop */}
            <h2 className="text-2xl font-bold text-blue-600 hidden md:block px-2">
              PrecioÁgil 🐶
            </h2>
            
            {/* Título Móvil (Dentro del menú) */}
            <span className="text-xl font-bold text-blue-600 md:hidden">Menú</span>
            
            {/* Botón cerrar (Solo móvil) */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
               <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="space-y-2">
            <a 
              href="/dashboard" 
              onClick={() => setIsSidebarOpen(false)}
              className="block px-4 py-2 rounded-lg bg-blue-50 font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
              Productos
            </a>
            
            <a 
              href="#" 
              onClick={() => setIsSidebarOpen(false)}
              className="block px-4 py-2 rounded-lg hover:bg-slate-50 font-medium text-slate-600 transition-colors"
            >
              Ventas (Pronto)
            </a>
          </nav>
        </div>

        {/* --- PERFIL --- */}
        <div className="mt-auto pt-6 border-t border-slate-100">
           <UserProfile />
        </div>

      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-64px)] md:h-screen">
        {children}
      </main>
      
    </div>
  )
}