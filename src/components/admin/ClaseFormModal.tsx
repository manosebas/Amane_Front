import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import type { Clase } from '../../types/clase'
import type { Grupo } from '../../types/grupo'
import type { Actividad } from '../../types/actividad'

const BACKEND = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '')

type Props = {
  clase: Clase | null
  semanaId: string
  clubId: string
  open: boolean
  onClose: () => void
  onGuardado: () => void
}

type FilaCupo = { grupo_id: string; cupo: number | '' }

export function ClaseFormModal({ clase, semanaId, clubId, open, onClose, onGuardado }: Props) {
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [actividadId, setActividadId] = useState('')
  const [cupos, setCupos] = useState<FilaCupo[]>([])
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const editando = !!clase

  useEffect(() => {
    if (!open) return
    // Cargar grupos del club + actividades ofrecidas por el club
    Promise.all([
      api('/api/admin/grupos').then(r => r.json()).catch(() => ({})),
      api('/api/admin/clubes').then(r => r.json()).catch(() => ({})),
      api('/api/admin/actividades').then(r => r.json()).catch(() => ({})),
      api(`/api/admin/club-actividades/${clubId}`).then(r => r.json()).catch(() => ({})),
    ]).then(([gruposRes, clubesRes, actsRes, clubActRes]) => {
      const todos: Grupo[] = gruposRes?.grupos ?? []
      const club = (clubesRes?.clubes ?? []).find((c: { id: string }) => c.id === clubId)
      const grupoIds: string[] = club?.grupo_ids ?? []
      setGrupos(todos.filter(g => grupoIds.includes(g.id)).sort((a, b) => a.edad_min - b.edad_min))

      const todasAct: Actividad[] = actsRes?.actividades ?? []
      const actIds: string[] = clubActRes?.actividad_ids ?? []
      setActividades(todasAct.filter(a => actIds.includes(a.id)))
    })
  }, [open, clubId])

  useEffect(() => {
    if (!open) return
    if (clase) {
      setActividadId(clase.actividad_id)
      setCupos(clase.cupos.map(cg => ({ grupo_id: cg.grupo_id, cupo: cg.cupo })))
    } else {
      setActividadId('')
      setCupos([])
    }
    setError('')
  }, [open, clase])

  function toggleGrupo(grupoId: string) {
    setCupos(prev => {
      const existe = prev.find(c => c.grupo_id === grupoId)
      if (existe) return prev.filter(c => c.grupo_id !== grupoId)
      return [...prev, { grupo_id: grupoId, cupo: 10 }]
    })
  }

  function actualizarCupo(grupoId: string, cupo: number | '') {
    setCupos(prev => prev.map(c => c.grupo_id === grupoId ? { ...c, cupo } : c))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!actividadId) { setError('Selecciona una actividad.'); return }
    if (cupos.length === 0) { setError('Selecciona al menos un grupo.'); return }
    for (const c of cupos) {
      if (c.cupo === '' || Number(c.cupo) <= 0) {
        setError('Cada grupo debe tener un cupo mayor a 0.'); return
      }
    }

    setGuardando(true); setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const url = editando
        ? `${BACKEND}/api/admin/clases/${clase!.id}`
        : `${BACKEND}/api/admin/clases`

      const body = editando
        ? { cupos: cupos.map(c => ({ grupo_id: c.grupo_id, cupo: Number(c.cupo) })) }
        : {
            semana_id: semanaId,
            actividad_id: actividadId,
            cupos: cupos.map(c => ({ grupo_id: c.grupo_id, cupo: Number(c.cupo) })),
          }

      const res = await fetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) setError(data?.error ?? `Error (${res.status}).`)
      else onGuardado()
    } catch {
      setError('Error de conexión.')
    }
    setGuardando(false)
  }

  if (!open) return null

  const grupoSeleccionado = (id: string) => cupos.some(c => c.grupo_id === id)

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !guardando) onClose() }}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{editando ? 'Editar clase' : 'Nueva clase'}</h2>
          <button className="modal-close" onClick={onClose} disabled={guardando}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="cl-act">Actividad</label>
            <select
              id="cl-act"
              value={actividadId}
              onChange={e => setActividadId(e.target.value)}
              disabled={editando}
              required
            >
              <option value="">Selecciona…</option>
              {actividades.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
            {editando && <p className="text-muted" style={{ fontSize: '0.78rem' }}>La actividad no se puede cambiar tras crear la clase.</p>}
          </div>

          <div className="form-group">
            <label>Grupos y cupos</label>
            {grupos.length === 0 ? (
              <p className="text-muted">No hay grupos asignados a este club.</p>
            ) : (
              <div className="cupos-editor">
                {grupos.map(g => (
                  <div key={g.id} className="cupos-fila">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={grupoSeleccionado(g.id)}
                        onChange={() => toggleGrupo(g.id)}
                      />
                      <span>{g.nombre} <span className="text-muted">({g.edad_min}–{g.edad_max})</span></span>
                    </label>
                    {grupoSeleccionado(g.id) && (
                      <input
                        type="number"
                        min={1}
                        className="cupos-input"
                        value={cupos.find(c => c.grupo_id === g.id)?.cupo ?? ''}
                        onChange={e => actualizarCupo(g.id, e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Cupo"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div className="form-acciones">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={guardando}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
