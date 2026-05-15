import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import type { Club } from '../../types/club'
import type { Categoria, Actividad } from '../../types/actividad'

const BACKEND = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '')

export default function ClubActividad() {
  const [clubes, setClubes] = useState<Club[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [clubId, setClubId] = useState<string>('')
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set())
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const [clubesRes, catsRes, actsRes] = await Promise.all([
        api('/api/admin/clubes'),
        api('/api/admin/categorias'),
        api('/api/admin/actividades'),
      ])
      const clubesData = await clubesRes.json().catch(() => null)
      const catsData = await catsRes.json().catch(() => null)
      const actsData = await actsRes.json().catch(() => null)
      if (!clubesRes.ok) setError(clubesData?.error ?? 'Error al cargar.')
      else setClubes(clubesData?.clubes ?? [])
      if (catsRes.ok) setCategorias(catsData?.categorias ?? [])
      if (actsRes.ok) setActividades(actsData?.actividades ?? [])
    } catch {
      setError('Error de conexión.')
    }
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    if (!clubId) { setSeleccionadas(new Set()); return }
    api(`/api/admin/club-actividades/${clubId}`).then(async res => {
      const data = await res.json().catch(() => null)
      if (res.ok) setSeleccionadas(new Set(data?.actividad_ids ?? []))
    })
  }, [clubId])

  function toggle(actId: string) {
    setSeleccionadas(prev => {
      const next = new Set(prev)
      if (next.has(actId)) next.delete(actId)
      else next.add(actId)
      return next
    })
  }

  async function guardar() {
    if (!clubId) return
    setGuardando(true)
    setError('')
    setMensaje('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${BACKEND}/api/admin/club-actividades/${clubId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ actividad_ids: [...seleccionadas] }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) setError(data?.error ?? 'Error al guardar.')
      else setMensaje('Guardado.')
    } catch {
      setError('Error de conexión.')
    }
    setGuardando(false)
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-titulo">Actividades por club</h1>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {cargando ? (
        <div className="text-muted">Cargando...</div>
      ) : clubes.length === 0 ? (
        <p className="text-muted">Crea al menos un club primero.</p>
      ) : (
        <>
          <div className="filtros">
            <label htmlFor="ca-club">Club</label>
            <select id="ca-club" value={clubId} onChange={e => { setClubId(e.target.value); setMensaje('') }}>
              <option value="">Selecciona un club…</option>
              {clubes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          {clubId && (
            <>
              {categorias.length === 0 ? (
                <p className="text-muted">No hay actividades creadas todavía.</p>
              ) : (
                <div className="actividades-tablero">
                  {categorias.map(cat => {
                    const acts = actividades.filter(a => a.categoria_id === cat.id)
                    return (
                      <div key={cat.id} className="actividades-columna">
                        <header className="actividades-columna-header">
                          <h3 className="actividades-columna-titulo">{cat.nombre}</h3>
                          <span className="actividades-columna-count">{acts.length}</span>
                        </header>
                        <div className="actividades-columna-lista">
                          {acts.length === 0 ? (
                            <p className="actividades-columna-vacia">Sin actividades</p>
                          ) : (
                            acts.map(act => (
                              <label key={act.id} className="checkbox-label" style={{ padding: '8px 12px' }}>
                                <input
                                  type="checkbox"
                                  checked={seleccionadas.has(act.id)}
                                  onChange={() => toggle(act.id)}
                                />
                                <span>{act.nombre}</span>
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="form-acciones" style={{ marginTop: 24 }}>
                {mensaje && <span className="text-muted">{mensaje}</span>}
                <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar selección'}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
