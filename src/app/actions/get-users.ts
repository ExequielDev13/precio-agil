'use server'

import { supabaseAdmin } from "@/lib/supabase-admin"

export async function getAllUsers() {
  try {
    // Listar usuarios usando el API de administración de Auth
    // Esto accede directo a auth.users sin bloqueo de RLS
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.error("Error fetching users:", error)
      return []
    }

    // Mapeamos los datos para devolver una estructura limpia
    // Aquí recuperamos los metadatos que guardamos en el Login (Negocio, CUIT, etc)
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name || 'Sin nombre',
      businessName: user.user_metadata?.business_name || 'Sin negocio',
      cuit: user.user_metadata?.cuit_cuil || '-',
      role: user.role,
      lastSignIn: user.last_sign_in_at,
      createdAt: user.created_at
    }))

    return formattedUsers

  } catch (err) {
    console.error("Server Action Error:", err)
    return []
  }
}