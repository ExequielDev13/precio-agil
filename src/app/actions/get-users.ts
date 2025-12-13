'use server'

import { supabaseAdmin } from "@/lib/supabase-admin"

export async function getAllUsers() {
  console.log("--- INICIANDO GET ALL USERS ---")
  
  // 1. Verificamos si la KEY existe (sin mostrarla por seguridad)
  const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  console.log("¿Existe SUPABASE_SERVICE_ROLE_KEY?:", hasKey ? "SÍ" : "NO ❌")

  if (!hasKey) {
    console.error("ERROR CRÍTICO: No se encontró la Service Role Key.")
    return []
  }

  try {
    // 2. Intentamos pedir los usuarios
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.error("❌ Error devuelto por Supabase:", error.message)
      return []
    }

    if (!data || !data.users) {
      console.warn("⚠️ Supabase no devolvió el objeto 'users'.")
      return []
    }

    console.log(`✅ Éxito. Se encontraron ${data.users.length} usuarios brutos.`)

    // 3. Mapeo de datos
    const formattedUsers = data.users.map(user => ({
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
    console.error("🔥 Error inesperado en el Server Action:", err)
    return []
  }
}