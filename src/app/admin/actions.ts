'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Inicializamos el cliente con la LLAVE MAESTRA
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function getUsers() {
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
  
  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return users.map(user => ({
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    last_sign_in: user.last_sign_in_at,
    // Metadatos extendidos
    full_name: user.user_metadata?.full_name || '',
    business_type: user.user_metadata?.business_type || '',
    whatsapp: user.user_metadata?.whatsapp || '',
    country: user.user_metadata?.country || '',
    province: user.user_metadata?.province || '',
    
    approved: user.user_metadata?.approved === true || user.user_metadata?.approved === 'true',
    role: user.user_metadata?.role || 'user',
    license_expiry: user.user_metadata?.license_expiry || null,
    modules: user.user_metadata?.modules || {}
  }))
}

export async function updateUserConfig(userId: string, data: { approved: boolean, license_expiry: string | null, modules: any }) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { user_metadata: { approved: data.approved, license_expiry: data.license_expiry, modules: data.modules } }
  )
  if (error) throw new Error('Error updating user configuration')
  revalidatePath('/admin')
  return { success: true }
}

// --- NUEVAS FUNCIONES (Las que faltaban y causaban el error) ---

// 1. Eliminar Usuario
export async function deleteUser(userId: string) {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) throw error
  revalidatePath('/admin')
  return { success: true }
}

// 2. Cambiar Contraseña Manualmente
export async function adminChangePassword(userId: string, newPassword: string) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword
  })
  if (error) throw error
  revalidatePath('/admin')
  return { success: true }
}

// 3. Enviar Email de Recuperación
export async function sendRecoveryEmail(email: string) {
  // Redirige al dashboard para que al menos entren logueados
  const redirectTo = process.env.NEXT_PUBLIC_BASE_URL 
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard` 
    : 'http://localhost:3000/dashboard'

  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo
  })
  if (error) throw error
  return { success: true }
}