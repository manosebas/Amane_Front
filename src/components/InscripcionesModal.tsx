import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import type { Nino } from '../types/nino'
import type { Semana } from '../types/semana'
import type { ActividadDisponible } from '../types/clase'

const BACKEND = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '')

type Props = {
  nino: Nino | null
  open: boolean
  onClose: () => void
  onCambio: () => void
}

export function InscripcionesModal({ nino, open, onClose, onCambio }: Props) {
  const [semanas, setSemanas] = useState<Semana[]>([])
  const [semanaSel, setSemanaSel] = useState<Semana | null>(null)
  const [actividades, setActividades] = useState<ActividadDisponible[]>([])
  const [cargandoSemanas, setCargandoSemanas] = useState(false)
  const [cargandoActs, setCargandoActs] = useState(false)
  const [error, setError] = useState('')
  const [accionando, setAccionando] = useState<string | null>(null)

  const cargarSemanas = useCallback(async () => {
    setCargandoSemanas(true); setError('')
    try {
      const res = await api('/api/inscripciones/semanas-activas')
      const data = await res.json().catch(() => null)
      if (!res.ok) setError(data?.error ?? 'Error al cargar semanas.')
      else setSemanas(data?.semanas ?? [])
    } catch {
      setError('Error de conexión.')
    }
    setCargandoSemanas(false)
  }, [])

  const cargarActividades = useCallback(async (semanaId: string) => {
    if (!nino) return
    setCargandoActs(true); setError('')
    try {
      const res = await api(`/api/inscripciones/actividades-disponibles/${nino.id}?semana_id=${semanaId}`)
      const data = await res.json().catch(() => null)
      if (!res.ok) setError(data?.error ?? 'Error al cargar actividades.')
      else setActividades(data?.actividades ?? [])
    } catch {
      setError('Error de conexión.')
    }
    setCargandoActs(false)
  }, [nino])

  useEffect(() => {
    if (open && nino) {
      setSemanaSel(null)
      setActividades([])
      cargarSemanas()
    }
  }, [open, nino, cargarSemanas])

  function elegirSemana(s: Semana) {
    setSemanaSel(s)
    cargarActividades(s.id)
  }

  function volverASemanas() {
    setSemanaSel(null)
    setActividades([])
    setError('')
  }

  async function toggle(a: ActividadDisponible) {
    if (!nino || !semanaSel) return
    setAccionando(a.clase_grupo_id); setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (a.inscripcion_id) {
        const res = await fetch(`${BACKEND}/api/inscripciones/${a.inscripcion_id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session?.access_token}` },
        })
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          setError(data?.error ?? 'Error al cancelar.')
        }
      } else {
        const res = await fetch(`${BACKEND}/api/inscripciones`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ nino_id: nino.id, clase_grupo_id: a.clase_grupo_id }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          setError(data?.error ?? 'Error al inscribir.')
        }
      }
      await cargarActividades(semanaSel.id)
      onCambio()
    } catch {
      setError('Error de conexión.')
    }
    setAccionando(null)
  }

  if (!open || !nino) return null

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-grande" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <h2>Inscripciones</h2>
            <p className="text-muted">
              {nino.nombre} {nino.apellido}
              {nino.grupo && <> · grupo <strong>{nino.grupo.nombre}</strong></>}
              {semanaSel && (
                <> · semana <strong>{semanaSel.nombre || `${semanaSel.fecha_inicio} → ${semanaSel.fecha_fin}`}</strong></>
              )}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {!semanaSel ? (
          cargandoSemanas ? (
            <p className="text-muted">Cargando semanas...</p>
          ) : semanas.length === 0 ? (
            <p className="text-muted">No hay semanas activas en este momento.</p>
          ) : (
            <div className="semanas-lista">
              {semanas.map(s => (
                <button
                  key={s.id}
                  type="button"
                  className="semana-card"
                  onClick={() => elegirSemana(s)}
                >
                  <div className="semana-card-titulo">{s.nombre || 'Sin nombre'}</div>
                  <div className="semana-card-fechas text-muted">
                    {s.fecha_inicio} → {s.fecha_fin}
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          <>
            <div className="paso-acciones">
              <button type="button" className="btn btn-secondary btn-sm" onClick={volverASemanas}>
                ← Volver a semanas
              </button>
            </div>

            {cargandoActs ? (
              <p className="text-muted">Cargando actividades...</p>
            ) : actividades.length === 0 ? (
              <p className="text-muted">No hay actividades disponibles para el grupo de este niño en esta semana.</p>
            ) : (
              <ul className="actividades-disponibles">
                {actividades.map(a => {
                  const lleno = a.inscritos >= a.cupo && !a.inscripcion_id
                  const inscrito = !!a.inscripcion_id
                  return (
                    <li key={a.clase_grupo_id} className={`actividad-disponible ${inscrito ? 'inscrita' : ''} ${lleno ? 'llena' : ''}`}>
                      <div className="actividad-disponible-info">
                        <span className="actividad-disponible-nombre">{a.actividad?.nombre ?? '—'}</span>
                        <span className="actividad-disponible-cupo">{a.inscritos} / {a.cupo}</span>
                      </div>
                      <button
                        type="button"
                        className={`btn btn-sm ${inscrito ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => toggle(a)}
                        disabled={(lleno && !inscrito) || accionando === a.clase_grupo_id}
                      >
                        {accionando === a.clase_grupo_id
                          ? '...'
                          : inscrito
                            ? 'Cancelar'
                            : lleno
                              ? 'Sin cupo'
                              : 'Inscribir'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}

        {error && <p className="error-msg">{error}</p>}

        <div className="form-acciones">
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
