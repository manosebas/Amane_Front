import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import type { Nino } from '../types/nino'
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
  const [slots, setSlots] = useState<SlotPadre[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [accionando, setAccionando] = useState<string | null>(null)
  const [hayActiva, setHayActiva] = useState(true)

  const cargar = useCallback(async () => {
    if (!nino) return
    setCargando(true); setError('')
    try {
      const res = await api(`/api/inscripciones/slots-disponibles/${nino.id}`)
      const data = await res.json().catch(() => null)
      if (!res.ok) setError(data?.error ?? 'Error al cargar slots.')
      else {
        setSlots(data?.slots ?? [])
        setHayActiva(!!data?.semana_id)
      }
    } catch {
      setError('Error de conexión.')
    }
    setCargando(false)
  }, [nino])

  useEffect(() => {
    if (open && nino) cargar()
  }, [open, nino, cargar])

  async function toggleSlot(s: SlotPadre) {
    if (!nino) return
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
      await cargar()
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
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {cargando ? (
          <p className="text-muted">Cargando slots...</p>
        ) : !hayActiva ? (
          <p className="text-muted">No hay semana activa en este momento.</p>
        ) : slots.length === 0 ? (
          <p className="text-muted">No hay slots disponibles para el grupo de este niño.</p>
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

        {error && <p className="error-msg">{error}</p>}

        <div className="form-acciones">
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
