import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import type { Nino } from '../types/nino'
import type { Semana } from '../types/semana'
import type { SlotPadre } from '../types/slot'
import { DIAS, DIAS_LABEL } from '../types/slot'

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
  const [slots, setSlots] = useState<SlotPadre[]>([])
  const [cargandoSemanas, setCargandoSemanas] = useState(false)
  const [cargandoSlots, setCargandoSlots] = useState(false)
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

  const cargarSlots = useCallback(async (semanaId: string) => {
    if (!nino) return
    setCargandoSlots(true); setError('')
    try {
      const res = await api(`/api/inscripciones/slots-disponibles/${nino.id}?semana_id=${semanaId}`)
      const data = await res.json().catch(() => null)
      if (!res.ok) setError(data?.error ?? 'Error al cargar slots.')
      else setSlots(data?.slots ?? [])
    } catch {
      setError('Error de conexión.')
    }
    setCargandoSlots(false)
  }, [nino])

  useEffect(() => {
    if (open && nino) {
      setSemanaSel(null)
      setSlots([])
      cargarSemanas()
    }
  }, [open, nino, cargarSemanas])

  function elegirSemana(s: Semana) {
    setSemanaSel(s)
    cargarSlots(s.id)
  }

  function volverASemanas() {
    setSemanaSel(null)
    setSlots([])
    setError('')
  }

  async function toggleSlot(s: SlotPadre) {
    if (!nino || !semanaSel) return
    setAccionando(s.id)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (s.inscripcion_id) {
        const res = await fetch(`${BACKEND}/api/inscripciones/${s.inscripcion_id}`, {
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
          body: JSON.stringify({ nino_id: nino.id, slot_id: s.id }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          setError(data?.error ?? 'Error al inscribir.')
        }
      }
      await cargarSlots(semanaSel.id)
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
          // Paso 1: elegir semana
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
          // Paso 2: slots de la semana
          <>
            <div className="paso-acciones">
              <button type="button" className="btn btn-secondary btn-sm" onClick={volverASemanas}>
                ← Volver a semanas
              </button>
            </div>

            {cargandoSlots ? (
              <p className="text-muted">Cargando slots...</p>
            ) : slots.length === 0 ? (
              <p className="text-muted">No hay slots disponibles para el grupo de este niño en esta semana.</p>
            ) : (
              <div className="semana-calendario">
                {DIAS.map(d => {
                  const slotsDia = slots.filter(s => s.dia === d).sort((a, b) =>
                    a.hora_inicio.localeCompare(b.hora_inicio)
                  )
                  if (slotsDia.length === 0) return null
                  return (
                    <div key={d} className="semana-dia">
                      <header className="semana-dia-header"><h3>{DIAS_LABEL[d]}</h3></header>
                      <div className="semana-dia-slots">
                        {slotsDia.map(s => {
                          const lleno = s.inscritos >= s.cupo && !s.inscripcion_id
                          const inscrito = !!s.inscripcion_id
                          return (
                            <button
                              key={s.id}
                              type="button"
                              className={`slot-card slot-padre ${inscrito ? 'slot-inscrito' : ''} ${lleno ? 'slot-lleno' : ''}`}
                              onClick={() => !lleno && !accionando && toggleSlot(s)}
                              disabled={lleno || accionando === s.id}
                            >
                              <div className="slot-card-hora">{s.hora_inicio.slice(0,5)} – {s.hora_fin.slice(0,5)}</div>
                              <div className="slot-card-act">{s.actividad?.nombre ?? '—'}</div>
                              <div className="slot-card-meta">
                                <span>{s.inscritos}/{s.cupo}</span>
                                {s.personal && <span>· {s.personal.nombre} {s.personal.apellido}</span>}
                              </div>
                              <div className="slot-card-estado">
                                {inscrito ? '✓ Inscrito' : lleno ? 'Sin cupo' : 'Inscribir'}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
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
