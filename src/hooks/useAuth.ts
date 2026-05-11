import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

export type Rol = 'admin' | 'padre'

export type Perfil = {
  id: string
  nombre: string
  apellido: string
  cedula: string
  telefono: string
  es_socio: boolean
  club: { id: string; nombre: string } | null
} | null

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil>(null)
  const [rol, setRol] = useState<Rol | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelado = false

    async function cargar(s: Session | null) {
      if (cancelado) return
      setSession(s)
      setUser(s?.user ?? null)

      if (s) {
        try {
          const res = await api('/api/me')
          if (!cancelado && res.ok) {
            const data = await res.json()
            setRol(data.rol)
            setPerfil(data.perfil)
          }
        } catch {
          // si falla /api/me dejamos rol en null
        }
      } else {
        setRol(null)
        setPerfil(null)
      }

      if (!cancelado) setLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => cargar(session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      cargar(s)
    })

    return () => {
      cancelado = true
      subscription.unsubscribe()
    }
  }, [])

  const signOut = () => supabase.auth.signOut()

  return { user, session, perfil, rol, loading, signOut }
}
