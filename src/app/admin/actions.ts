'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

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
    business_type: user.user_metadata?.business_type || 'N/A',
    whatsapp: user.user_metadata?.whatsapp || 'N/A',
    approved: user.user_metadata?.approved === true || user.user_metadata?.approved === 'true',
    role: user.user_metadata?.role || 'user',
    license_expiry: user.user_metadata?.license_expiry || null,
    modules: user.user_metadata?.modules || {}
  }))
}

export async function updateUserConfig(userId: string, data: { 
  approved: boolean, 
  license_expiry: string | null,
  modules: any 
}) {
  
  const { error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { 
      user_metadata: { 
        approved: data.approved,
        license_expiry: data.license_expiry,
        modules: data.modules
      } 
    }
  )

  if (error) throw new Error('Error updating user configuration')

  revalidatePath('/admin')
  return { success: true }
}