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
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {/* --- OVERLAY (Fondo Oscuro para Móvil) --- */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[90] md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- BARRA LATERAL (Sidebar) --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-[100] w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl
        md:relative md:translate-x-0 md:z-0 md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        <div>
          {/* Encabezado del Menú */}
          <div className="mb-6 flex justify-between items-center">
           
            <h2 className="text-2xl font-bold text-black-600 hidden md:block px-2">
              nexO<span className="text-blue-600">stock📦</span>
            </h2>

            
            <span className="text-xl font-bold text-blue-600 md:hidden">Menú</span>
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

        <div className="mt-auto pt-6 border-t border-slate-100">
           <UserProfile />
        </div>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 overflow-y-auto relative">
        
        {/* --- HEADER MÓVIL --- */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 mb-4">
          {/* AQUÍ TAMBIÉN ESTABA EL NOMBRE VIEJO */}
          <span className="font-bold text-blue-600 text-lg">nexOstock</span>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        <div className="p-4 md:p-8">
          {children}
        </div>

      </main>
      
    </div>
  )
}