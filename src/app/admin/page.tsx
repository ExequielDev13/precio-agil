'use client'

import { useEffect, useState } from 'react'
import { getUsers, updateUserConfig, deleteUser, adminChangePassword, sendRecoveryEmail } from './actions'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CheckCircle, XCircle, RefreshCw, Settings, Calendar, 
  Shield, Search, Trash2, Key, Mail, Lock 
} from 'lucide-react'
import { toast } from "sonner"

const AVAILABLE_MODULES = [
  { id: 'stock', label: 'Gestión de Stock' },
  { id: 'ventas', label: 'Módulo de Ventas' },
  { id: 'reportes', label: 'Reportes Avanzados' },
  { id: 'usuarios', label: 'Gestión de Empleados' }
]

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estado para la búsqueda y edición
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState<any>(null)
  
  // Estado para el cambio de contraseña manual
  const [newPass, setNewPass] = useState('')

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

  // --- FILTRADO INTELIGENTE ---
  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase()
    // Busca en todos los campos relevantes
    return (
      user.email?.toLowerCase().includes(term) ||
      user.full_name?.toLowerCase().includes(term) ||
      user.business_type?.toLowerCase().includes(term) ||
      user.province?.toLowerCase().includes(term) ||
      user.whatsapp?.includes(term)
    )
  })

  // Guardar Configuración General
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    try {
        await updateUserConfig(editingUser.id, {
            approved: editingUser.approved,
            license_expiry: editingUser.license_expiry,
            modules: editingUser.modules || {}
        })
        toast.success("Configuración actualizada")
        setEditingUser(null)
        loadUsers()
    } catch (error) {
        toast.error("Error al guardar")
    }
  }

  // Eliminar Usuario
  const handleDelete = async () => {
    if (!editingUser) return
    const confirm = window.confirm(`¿ESTÁS SEGURO?\n\nVas a eliminar a ${editingUser.email}.\nEsta acción NO se puede deshacer.`)
    if (!confirm) return

    try {
      await deleteUser(editingUser.id)
      toast.success("Usuario eliminado correctamente")
      setEditingUser(null)
      loadUsers()
    } catch (error) {
      toast.error("Error al eliminar usuario")
    }
  }

  // Cambiar Contraseña Manual
  const handleChangePass = async () => {
    if (!newPass || newPass.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }
    try {
      await adminChangePassword(editingUser.id, newPass)
      toast.success("Contraseña actualizada")
      setNewPass('')
    } catch (error) {
      toast.error("Error al cambiar contraseña")
    }
  }

  // Enviar Email de Recuperación
  const handleSendRecovery = async () => {
    try {
      await sendRecoveryEmail(editingUser.email)
      toast.success(`Email de recuperación enviado a ${editingUser.email}`)
    } catch (error) {
      toast.error("Error al enviar email")
    }
  }

  const toggleModule = (moduleId: string, isActive: boolean) => {
    setEditingUser((prev: any) => ({
        ...prev,
        modules: { ...prev.modules, [moduleId]: isActive }
    }))
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      
      {/* HEADER + BUSCADOR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600"/> Super Admin Panel
        </h1>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por email, provincia..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={loadUsers} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* LISTA DE USUARIOS */}
      <div className="grid gap-4">
        {filteredUsers.length === 0 && !loading && (
          <div className="text-center p-10 border-2 border-dashed rounded-lg text-slate-400">
            No se encontraron usuarios con "{searchTerm}"
          </div>
        )}

        {filteredUsers.map((user) => (
          <Card key={user.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row items-center justify-between p-4 gap-4">
                
                {/* Info Básica */}
                <div className="flex-1 min-w-0 grid gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg truncate">{user.email}</h3>
                    {user.role === 'superadmin' && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded font-bold">ADMIN</span>}
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${user.approved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.approved ? 'ACTIVO' : 'PENDIENTE'}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                    <span>📍 {user.province || 'Sin prov.'}</span>
                    <span>🏢 {user.business_type}</span>
                    <span>📞 {user.whatsapp}</span>
                    {user.license_expiry && (
                        <span className={new Date(user.license_expiry) < new Date() ? "text-red-500 font-bold" : "text-blue-600"}>
                            📅 Vence: {new Date(user.license_expiry).toLocaleDateString()}
                        </span>
                    )}
                  </div>
                </div>

                {/* Botón CONFIGURAR */}
                <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => { if(!open) setEditingUser(null); setNewPass(''); }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => setEditingUser(user)}>
                        <Settings className="h-4 w-4 mr-2" /> Gestionar
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Gestionar Cliente: {user.email}</DialogTitle>
                    </DialogHeader>

                    {/* TABS PARA ORGANIZAR EL MODAL */}
                    <Tabs defaultValue="general" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">General y Licencia</TabsTrigger>
                        <TabsTrigger value="security">Seguridad</TabsTrigger>
                      </TabsList>

                      {/* TAB 1: GENERAL */}
                      <TabsContent value="general">
                        <form onSubmit={handleSaveConfig} className="space-y-4 py-4">
                            
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                                <Label className="font-bold">Acceso al Sistema</Label>
                                <div className="flex items-center gap-2">
                                    <Switch 
                                        checked={editingUser?.approved}
                                        onCheckedChange={(val) => setEditingUser({...editingUser, approved: val})}
                                    />
                                    <span className="text-xs text-slate-500">{editingUser?.approved ? 'Habilitado' : 'Bloqueado'}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2"><Calendar className="h-4 w-4"/> Vencimiento de Licencia</Label>
                                <Input 
                                    type="date" 
                                    value={editingUser?.license_expiry || ''} 
                                    onChange={(e) => setEditingUser({...editingUser, license_expiry: e.target.value})}
                                />
                            </div>

                            <div className="space-y-3 pt-2">
                                <Label>Módulos Habilitados</Label>
                                <div className="grid grid-cols-1 gap-2 border rounded-lg p-3 max-h-40 overflow-y-auto">
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

                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Guardar Cambios</Button>
                        </form>
                      </TabsContent>

                      {/* TAB 2: SEGURIDAD Y ELIMINAR */}
                      <TabsContent value="security" className="space-y-6 py-4">
                        
                        {/* CAMBIAR CONTRASEÑA */}
                        <div className="space-y-4 border p-4 rounded-lg">
                          <h4 className="font-bold flex items-center gap-2 text-slate-700"><Key className="h-4 w-4"/> Contraseña</h4>
                          
                          <div className="flex gap-2">
                             <Input 
                                type="text" 
                                placeholder="Nueva contraseña..." 
                                value={newPass}
                                onChange={(e) => setNewPass(e.target.value)}
                             />
                             <Button onClick={handleChangePass} size="sm">Cambiar</Button>
                          </div>
                          <div className="relative flex items-center py-2">
                            <span className="w-full border-t" />
                            <span className="px-2 text-xs text-slate-400">O</span>
                            <span className="w-full border-t" />
                          </div>
                          <Button variant="outline" className="w-full" onClick={handleSendRecovery}>
                             <Mail className="h-4 w-4 mr-2" /> Enviar Email de Recuperación
                          </Button>
                        </div>

                        {/* ZONA DE PELIGRO */}
                        <div className="border border-red-200 bg-red-50 p-4 rounded-lg space-y-2">
                           <h4 className="font-bold text-red-700 flex items-center gap-2"><Trash2 className="h-4 w-4"/> Zona de Peligro</h4>
                           <p className="text-xs text-red-600">Eliminar al usuario borrará sus datos de acceso permanentemente.</p>
                           <Button variant="destructive" className="w-full" onClick={handleDelete}>
                              Eliminar Usuario
                           </Button>
                        </div>

                      </TabsContent>
                    </Tabs>

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