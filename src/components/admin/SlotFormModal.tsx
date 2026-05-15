import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import type { Slot, DiaSlot } from '../../types/slot'
import { DIAS, DIAS_LABEL } from '../../types/slot'
import type { Grupo } from '../../types/grupo'
import type { Actividad } from '../../types/actividad'
import type { Personal } from '../../types/personal'

const BACKEND = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '')

type Props = {
  slot: Slot | null
  semanaId: string
  clubId: string
  diaPredet?: DiaSlot | null
  open: boolean
  onClose: () => void
  onGuardado: () => void
  onEliminar?: (slot: Slot) => void
}

export function SlotFormModal({ slot, semanaId, clubId, diaPredet, open, onClose, onGuardado, onEliminar }: Props) {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [profesores, setProfesores] = useState<Personal[]>([])

  const [grupoId, setGrupoId] = useState('')
  const [actividadId, setActividadId] = useState('')
  const [dia, setDia] = useState<DiaSlot>('lunes')
  const [horaInicio, setHoraInicio] = useState('09:00')
  const [horaFin, setHoraFin] = useState('10:00')
  const [cupo, setCupo] = useState<number | ''>(10)
  const [personalId, setPersonalId] = useState('')

  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const editando = !!slot

  useEffect(() => {
    if (!open) return
    // Cargar datos del club: grupos asignados, actividades asignadas, profesores del club
    Promise.all([
      api('/api/admin/grupos').then(r => r.json()).catch(() => ({})),
      api('/api/admin/clubes').then(r => r.json()).catch(() => ({})),
      api(`/api/admin/club-actividades/${clubId}`).then(r => r.json()).catch(() => ({})),
      api('/api/admin/actividades').then(r => r.json()).catch(() => ({})),
      api(`/api/admin/personal?club_id=${clubId}`).then(r => r.json()).catch(() => ({})),
    ]).then(([gruposRes, clubesRes, clubActRes, actRes, perRes]) => {
      const todosGrupos: Grupo[] = gruposRes?.grupos ?? []
      const club = (clubesRes?.clubes ?? []).find((c: { id: string }) => c.id === clubId)
      const grupoIds: string[] = club?.grupo_ids ?? []
      setGrupos(todosGrupos.filter(g => grupoIds.includes(g.id)))

      const todasActs: Actividad[] = actRes?.actividades ?? []
      const actIds: string[] = clubActRes?.actividad_ids ?? []
      setActividades(todasActs.filter(a => actIds.includes(a.id)))

      const personal: Personal[] = perRes?.personal ?? []
      setProfesores(personal.filter(p => p.rol === 'profesor'))
    })
  }, [open, clubId])

  useEffect(() => {
    if (!open) return
    if (slot) {
      setGrupoId(slot.grupo_id)
      setActividadId(slot.actividad_id)
      setDia(slot.dia)
      setHoraInicio(slot.hora_inicio.slice(0, 5))
      setHoraFin(slot.hora_fin.slice(0, 5))
      setCupo(slot.cupo)
      setPersonalId(slot.personal_id ?? '')
    } else {
      setGrupoId('')
      setActividadId('')
      setDia(diaPredet ?? 'lunes')
      setHoraInicio('09:00')
      setHoraFin('10:00')
      setCupo(10)
      setPersonalId('')
    }
    setError('')
  }, [open, slot, diaPredet])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!grupoId || !actividadId) { setError('Grupo y actividad son requeridos.'); return }
    if (horaFin <= horaInicio) { setError('Hora fin debe ser mayor que la inicio.'); return }
    if (cupo === '' || Number(cupo) <= 0) { setError('Cupo inválido.'); return }

    setGuardando(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const url = editando
        ? `${BACKEND}/api/admin/slots/${slot!.id}`
        : `${BACKEND}/api/admin/slots`
      const res = await fetch(url, {
        method: editando ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          semana_id: semanaId,
          grupo_id: grupoId,
          actividad_id: actividadId,
          dia,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          cupo: Number(cupo),
          personal_id: personalId || null,
        }),
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

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !guardando) onClose() }}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{editando ? 'Editar slot' : 'Nuevo slot'}</h2>
          <button className="modal-close" onClick={onClose} disabled={guardando}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="slot-dia">Día</label>
              <select id="slot-dia" value={dia} onChange={e => setDia(e.target.value as DiaSlot)}>
                {DIAS.map(d => <option key={d} value={d}>{DIAS_LABEL[d]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="slot-grupo">Grupo</label>
              <select id="slot-grupo" value={grupoId} onChange={e => setGrupoId(e.target.value)} required>
                <option value="">Selecciona…</option>
                {grupos.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.nombre} ({g.edad_min}–{g.edad_max})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="slot-act">Actividad</label>
            <select id="slot-act" value={actividadId} onChange={e => setActividadId(e.target.value)} required>
              <option value="">Selecciona…</option>
              {actividades.map(a => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="slot-inicio">Hora inicio</label>
              <input id="slot-inicio" type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="slot-fin">Hora fin</label>
              <input id="slot-fin" type="time" value={horaFin} onChange={e => setHoraFin(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="slot-cupo">Cupo</label>
              <input
                id="slot-cupo" type="number" min={1}
                value={cupo}
                onChange={e => setCupo(e.target.value === '' ? '' : Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="slot-prof">Profesor (opcional)</label>
            <select id="slot-prof" value={personalId} onChange={e => setPersonalId(e.target.value)}>
              <option value="">Sin asignar</option>
              {profesores.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
              ))}
            </select>
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div className="form-acciones">
            {editando && onEliminar && slot && (
              <button type="button" className="btn-eliminar-form" onClick={() => onEliminar(slot)} disabled={guardando}>
                Eliminar slot
              </button>
            )}
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
