"use client"

import { useEffect, useState } from "react"
// Importamos TODO desde el archivo local "action.ts"
import { 
  getAllUsers, 
  deleteUser, 
  updateUserProfile, 
  updateUserLicense, 
  adminChangePassword, 
  sendPasswordReset 
} from "./actions" 

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Settings, Trash2, Key, Calendar, CheckSquare, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

// Definición de tipos
type User = {
  id: string
  email: string
  fullName: string
  businessName: string
  cuit: string
  createdAt: string
  licenseEnd?: string 
  modules?: string[]
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estado del Modal y Formularios
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'license' | 'security'>('profile')

  const [formData, setFormData] = useState({ fullName: '', businessName: '', cuit: '' })
  const [licenseData, setLicenseData] = useState({ licenseEnd: '', modules: [] as string[] })
  const [passwordData, setPasswordData] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const data = await getAllUsers()
      // @ts-ignore
      setUsers(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // --- ABRIR MODAL ---
  const openModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      fullName: user.fullName,
      businessName: user.businessName,
      cuit: user.cuit
    })
    setLicenseData({
      licenseEnd: user.licenseEnd || '',
      modules: user.modules || []
    })
    setPasswordData('')
    setIsModalOpen(true)
  }

  // --- HANDLERS (GUARDAR DATOS) ---
  const handleSaveProfile = async () => {
    if (!selectedUser) return
    const res = await updateUserProfile(selectedUser.id, formData)
    if (res.success) { alert('Perfil actualizado'); loadData(); }
    else alert(res.error)
  }

  const handleSaveLicense = async () => {
    if (!selectedUser) return
    const res = await updateUserLicense(selectedUser.id, licenseData)
    if (res.success) { alert('Licencia actualizada'); loadData(); }
    else alert(res.error)
  }

  const handleChangePassword = async () => {
    if (!selectedUser) return
    const res = await adminChangePassword(selectedUser.id, passwordData)
    if (res.success) { alert('Contraseña cambiada'); setPasswordData(''); }
    else alert(res.error)
  }

  const handleSendResetEmail = async () => {
    if (!selectedUser) return
    const res = await sendPasswordReset(selectedUser.email)
    if (res.success) alert(`Email enviado a ${selectedUser.email}`)
    else alert(res.error)
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    if (!confirm(`PELIGRO: ¿Borrar a ${selectedUser.email}?`)) return
    const res = await deleteUser(selectedUser.id)
    if (res.success) { alert('Usuario eliminado'); setIsModalOpen(false); loadData(); }
    else alert(res.error)
  }

  // --- CHECKBOX HELPER ---
  const toggleModule = (module: string) => {
    setLicenseData(prev => {
      const exists = prev.modules.includes(module)
      if (exists) return { ...prev, modules: prev.modules.filter(m => m !== module) }
      return { ...prev, modules: [...prev.modules, module] }
    })
  }

  if (loading) return <div className="p-8 text-center">Cargando panel...</div>

  return (
    <div className="p-6 relative">
      <Card>
        <CardHeader><CardTitle>Panel de Super Admin ({users.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Negocio</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-bold">{user.businessName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.licenseEnd 
                      ? <Badge variant="outline">{user.licenseEnd}</Badge> 
                      : <span className="text-slate-400 text-sm">--</span>
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => openModal(user)}>
                      <Settings className="mr-2 h-4 w-4" /> Administrar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* --- MODAL --- */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="bg-slate-100 p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{selectedUser.businessName}</h3>
                <p className="text-sm text-slate-500">{selectedUser.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex border-b">
              {['profile', 'license', 'security'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 p-3 text-sm font-medium capitalize 
                    ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {tab === 'profile' ? 'Perfil' : tab === 'license' ? 'Licencia' : 'Seguridad'}
                </button>
              ))}
            </div>

            <div className="p-6 min-h-[300px]">
              
              {/* PERFIL */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Responsable</Label><Input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Negocio</Label><Input value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} /></div>
                    <div className="space-y-2"><Label>CUIT</Label><Input value={formData.cuit} onChange={e => setFormData({...formData, cuit: e.target.value})} /></div>
                  </div>
                  <Button onClick={handleSaveProfile} className="w-full mt-4">Guardar Cambios</Button>
                </div>
              )}

              {/* LICENCIA */}
              {activeTab === 'license' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Calendar className="h-4 w-4"/> Vencimiento</Label>
                    <Input type="date" value={licenseData.licenseEnd} onChange={e => setLicenseData({...licenseData, licenseEnd: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2"><CheckSquare className="h-4 w-4"/> Permisos</Label>
                    <div className="grid grid-cols-2 gap-4 border p-4 rounded-md">
                      {['Stock', 'Ventas', 'Empleados', 'Reportes'].map((mod) => (
                        <div key={mod} className="flex items-center space-x-2">
                          <Checkbox id={mod} checked={licenseData.modules.includes(mod)} onCheckedChange={() => toggleModule(mod)} />
                          <label htmlFor={mod} className="text-sm font-medium cursor-pointer">{mod}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleSaveLicense} className="w-full bg-blue-600 hover:bg-blue-700">Actualizar Licencia</Button>
                </div>
              )}

              {/* SEGURIDAD */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    Zona de peligro.
                  </div>
                  <div className="space-y-2">
                    <Label>Nueva Contraseña (Manual)</Label>
                    <div className="flex gap-2">
                      <Input value={passwordData} onChange={e => setPasswordData(e.target.value)} placeholder="Ej: 123456" />
                      <Button onClick={handleChangePassword} variant="secondary">Cambiar</Button>
                    </div>
                  </div>
                  <div className="pt-4 border-t space-y-2">
                    <Button variant="outline" onClick={handleSendResetEmail} className="w-full justify-start"><Key className="mr-2 h-4 w-4"/> Enviar Email Reseteo</Button>
                    <Button variant="destructive" onClick={handleDeleteUser} className="w-full justify-start"><Trash2 className="mr-2 h-4 w-4"/> Eliminar Usuario</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}