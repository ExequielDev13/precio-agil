'use server'

import { supabaseAdmin } from "@/lib/supabase-admin" // Asegúrate de tener este archivo configurado
import { revalidatePath } from "next/cache"

// --- 1. OBTENER USUARIOS (Para llenar la tabla) ---
export async function getAllUsers() {
  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
    if (error) throw error

    // Mapeamos los datos para devolver una estructura limpia al frontend
    return users.map(user => ({
      id: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name || 'Sin nombre',
      businessName: user.user_metadata?.business_name || 'Sin negocio',
      cuit: user.user_metadata?.cuit_cuil || '-',
      createdAt: user.created_at,
      licenseEnd: user.user_metadata?.license_end || '', // Fecha vencimiento
      modules: user.user_metadata?.allowed_modules || [] // Permisos ['stock', 'ventas', etc]
    }))

  } catch (err) {
    console.error("Error fetching users:", err)
    return []
  }
}

// --- 2. ELIMINAR USUARIO ---
export async function deleteUser(userId: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) throw error
    revalidatePath('/admin') // Recarga la ruta admin
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// --- 3. ACTUALIZAR PERFIL BÁSICO ---
export async function updateUserProfile(userId: string, data: { fullName: string, businessName: string, cuit: string }) {
  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        full_name: data.fullName,
        business_name: data.businessName,
        cuit_cuil: data.cuit
      }
    })
    if (error) throw error
    revalidatePath('/admin')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// --- 4. GESTIONAR LICENCIA Y PERMISOS ---
export async function updateUserLicense(userId: string, data: { 
  licenseEnd: string, 
  modules: string[]   
}) {
  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        license_end: data.licenseEnd,
        allowed_modules: data.modules
      }
    })
    if (error) throw error
    revalidatePath('/admin')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// --- 5. CAMBIAR CONTRASEÑA MANUALMENTE ---
export async function adminChangePassword(userId: string, newPassword: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    })
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// --- 6. ENVIAR EMAIL DE RESETEO ---
export async function sendPasswordReset(email: string) {
  try {
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.vercel.app')}/reset-password`,
    })
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}