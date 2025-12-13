'use client'

import { useEffect, useState } from 'react'
import { getUsers, updateUserConfig } from './actions'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch" // Necesitas instalar este componente si no lo tienes
import { CheckCircle, XCircle, RefreshCw, Settings, Calendar, Shield } from 'lucide-react'
import { toast } from "sonner"

// --- CONFIGURACIÓN DE MÓDULOS ---
// Agrega aquí las secciones futuras que crees
const AVAILABLE_MODULES = [
  { id: 'stock', label: 'Gestión de Stock' },
  { id: 'ventas', label: 'Módulo de Ventas' },
  { id: 'reportes', label: 'Reportes Avanzados' },
  { id: 'usuarios', label: 'Gestión de Empleados' }
]

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<any>(null) // Usuario seleccionado para editar

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await getUsers()
      setUsers(data)
    } catch (error) {
      toast.error("Error al cargar usuarios")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    try {
        await updateUserConfig(editingUser.id, {
            approved: editingUser.approved,
            license_expiry: editingUser.license_expiry,
            modules: editingUser.modules || {}
        })
        toast.success("Configuración actualizada correctamente")
        setEditingUser(null) // Cerrar modal
        loadUsers() // Recargar lista
    } catch (error) {
        toast.error("Error al guardar cambios")
    }
  }

  // Helper para cambiar un módulo específico
  const toggleModule = (moduleId: string, isActive: boolean) => {
    setEditingUser((prev: any) => ({
        ...prev,
        modules: {
            ...prev.modules,
            [moduleId]: isActive
        }
    }))
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600"/> Super Admin Panel
        </h1>
        <Button onClick={loadUsers} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </Button>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row items-center justify-between p-4 gap-4">
                
                {/* Info Básica */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg truncate">{user.email}</h3>
                    {user.role === 'superadmin' && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded font-bold">ADMIN</span>}
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${user.approved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.approved ? 'ACTIVO' : 'PENDIENTE'}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 flex gap-4">
                    <span>🏢 {user.business_type}</span>
                    <span>📞 {user.whatsapp}</span>
                    {user.license_expiry && (
                        <span className={new Date(user.license_expiry) < new Date() ? "text-red-500 font-bold" : "text-blue-600"}>
                            📅 Vence: {new Date(user.license_expiry).toLocaleDateString()}
                        </span>
                    )}
                  </div>
                </div>

                {/* Botón CONFIGURAR (Abre Modal) */}
                <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => !open && setEditingUser(null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => setEditingUser(user)}>
                        <Settings className="h-4 w-4 mr-2" /> Configurar Cliente
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Gestionar Cliente: {user.email}</DialogTitle>
                    </DialogHeader>
                    
                    <form onSubmit={handleSaveConfig} className="space-y-6 py-4">
                        
                        {/* 1. Habilitar Acceso General */}
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                            <Label className="font-bold">Acceso al Sistema</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">{editingUser?.approved ? 'Habilitado' : 'Bloqueado'}</span>
                                <Switch 
                                    checked={editingUser?.approved}
                                    onCheckedChange={(val) => setEditingUser({...editingUser, approved: val})}
                                />
                            </div>
                        </div>

                        {/* 2. Fecha de Vencimiento */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2"><Calendar className="h-4 w-4"/> Vencimiento de Licencia</Label>
                            <Input 
                                type="date" 
                                value={editingUser?.license_expiry || ''} 
                                onChange={(e) => setEditingUser({...editingUser, license_expiry: e.target.value})}
                            />
                            <p className="text-xs text-slate-500">Si se deja vacío, la licencia es "de por vida".</p>
                        </div>

                        {/* 3. Módulos / Secciones */}
                        <div className="space-y-3">
                            <Label>Módulos Habilitados</Label>
                            <div className="grid grid-cols-1 gap-2 border rounded-lg p-3">
                                {AVAILABLE_MODULES.map((mod) => (
                                    <div key={mod.id} className="flex items-center justify-between">
                                        <span className="text-sm">{mod.label}</span>
                                        <Switch 
                                            checked={editingUser?.modules?.[mod.id] === true}
                                            onCheckedChange={(val) => toggleModule(mod.id, val)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                            Guardar Cambios
                        </Button>
                    </form>

                  </DialogContent>
                </Dialog>

              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}