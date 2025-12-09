'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LogOut, User as UserIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function UserProfile() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [])

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error("Error al salir")
    } else {
      router.push('/login') // Te manda al login al salir
      router.refresh()
    }
  }

  if (loading) return <div className="h-10 w-10 bg-slate-100 rounded-full animate-pulse" />

  if (!user) return null

  // Extraemos los datos de Google (o los datos por defecto)
  const avatarUrl = user.user_metadata?.avatar_url
  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0]
  const email = user.email

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
      
      {/* FOTO / AVATAR */}
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200">
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={fullName} 
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-blue-100 text-blue-600 font-bold">
            <UserIcon className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* TEXTO (Nombre y Email) */}
      <div className="flex flex-col flex-1 min-w-0">
        <span className="truncate text-sm font-medium text-slate-900">
          {fullName}
        </span>
        <span className="truncate text-xs text-slate-500">
          {email}
        </span>
      </div>

      {/* BOTÓN SALIR */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleSignOut}
        title="Cerrar Sesión"
        className="text-slate-400 hover:text-red-600 hover:bg-red-50"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )
}