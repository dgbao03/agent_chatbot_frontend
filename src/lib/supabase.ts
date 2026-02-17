// ========== SUPABASE COMMENTED - Migrating to FastAPI ==========
// import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// if (!supabaseUrl || !supabaseAnonKey) {
//   throw new Error('Missing Supabase environment variables')
// }

// export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//   auth: {
//     autoRefreshToken: true,
//     persistSession: true,
//     detectSessionInUrl: true
//   }
// })

/** Mock Supabase client - stub để UI chạy được khi chưa có API */
const createMockChain = (listResult: unknown[] = [], singleResult: unknown = null) => {
  const chain = {
    from: () => chain,
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
    eq: () => chain,
    order: () => chain,
    single: () => Promise.resolve({ data: singleResult, error: null }),
    maybeSingle: () => Promise.resolve({ data: singleResult, error: null }),
    in: () => chain,
    limit: () => chain,
    then: (resolve: (v: { data: unknown[]; error: null }) => unknown) =>
      Promise.resolve({ data: listResult, error: null }).then(resolve),
    catch: (fn: (e: unknown) => unknown) =>
      Promise.resolve({ data: listResult, error: null }).catch(fn),
  }
  return chain
}

export const supabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    signInWithOAuth: () => Promise.resolve({ data: { provider: '', url: '' }, error: null }),
    resetPasswordForEmail: () => Promise.resolve({ data: {}, error: null }),
    updateUser: () => Promise.resolve({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
  },
  from: () => createMockChain([]),
  rpc: () => Promise.resolve({ data: null, error: { message: 'Supabase disabled' } }),
}

