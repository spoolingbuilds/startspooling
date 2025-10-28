import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing Supabase environment variables')
  console.warn('[Supabase] NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.warn('[Supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey)
}

// Create Supabase client
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Database connection test
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('waitlist_signup')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('[Supabase] Connection test failed:', error)
      return { success: false, error: error.message }
    }
    
    console.log('[Supabase] Connection test successful')
    return { success: true, data }
  } catch (error) {
    console.error('[Supabase] Connection test error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Helper to get database URL for Prisma
export function getSupabaseDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required')
  }
  
  // Ensure the URL starts with postgresql://
  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    throw new Error('DATABASE_URL must start with postgresql:// or postgres://')
  }
  
  return databaseUrl
}
