import { supabase } from './supabase'

const BACKEND = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '')

export async function api(path: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
    ...options.headers,
  }
  return fetch(`${BACKEND}${path}`, { ...options, headers })
}

export async function fetchMe(accessToken: string) {
  const res = await fetch(`${BACKEND}/api/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  return res.json() as Promise<{ id: string; email: string; rol: 'admin' | 'padre'; perfil: unknown }>
}
