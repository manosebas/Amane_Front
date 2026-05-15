import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { SlotFormModal } from '../../components/admin/SlotFormModal'
import { DIAS, DIAS_LABEL, type DiaSlot, type Slot } from '../../types/slot'
import type { Semana } from '../../types/semana'

const BACKEND = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '')

export default function SemanaDetalle() {
  const { id } = useParams<{ id: string }>()
  const [semana, setSemana] = useState<Semana | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Slot | null>(null)
  const [diaPredet, setDiaPredet] = useState<DiaSlot | null>(null)
  const [eliminando, setEliminando] = useState<Slot | null>(null)
  const [errorEliminar, setErrorEliminar] = useState('')

  const cargar = useCallback(async () => {
    if (!id) return
    setCargando(true); setError('')
    try {
      const [semRes, slotsRes] = await Promise.all([
        api(`/api/admin/semanas/${id}`),
        api(`/api/admin/slots?semana_id=${id}`),
      ])
      const semData = await semRes.json().catch(() => null)
      const slotsData = await slotsRes.json().catch(() => null)
      if (!semRes.ok) setError(semData?.error ?? 'Semana no encontrada.')
      else setSemana(semData?.semana ?? null)
      if (slotsRes.ok) setSlots(slotsData?.slots ?? [])
    } catch {
      setError('Error de conexión.')
    }
    setCargando(false)
  }, [id])

  useEffect(() => { cargar() }, [cargar])

  async function eliminar(s: Slot) {
    setErrorEliminar('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${BACKEND}/api/admin/slots/${s.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { setErrorEliminar(data?.error ?? 'Error al eliminar.'); return }
      setEliminando(null)
      cargar()
    } catch {
      setErrorEliminar('Error de conexión.')
    }
  }

  function abrirNuevo(d: DiaSlot) {
    setEditando(null); setDiaPredet(d); setModalAbierto(true)
  }

  function abrirEditar(s: Slot) {
    setEditando(s); setDiaPredet(null); setModalAbierto(true)
  }

  if (cargando) return <div className="text-muted">Cargando...</div>
  if (error) return <div className="error-msg">{error}</div>
  if (!semana) return <div className="text-muted">Semana no encontrada.</div>

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <Link to="/admin/semanas" className="back-link">← Semanas</Link>
          <h1 className="admin-page-titulo">
            {semana.nombre || `${semana.fecha_inicio} → ${semana.fecha_fin}`}
          </h1>
          <p className="text-muted">
            {semana.fecha_inicio} → {semana.fecha_fin} ·{' '}
            <span className={`badge badge-${semana.estado === 'activa' ? 'activo' : 'inactivo'}`}>
              {semana.estado}
            </span>
          </p>
        </div>
      </div>

      <div className="semana-calendario">
        {DIAS.map(d => {
          const slotsDia = slots.filter(s => s.dia === d).sort((a, b) =>
            a.hora_inicio.localeCompare(b.hora_inicio)
          )
          return (
            <div key={d} className="semana-dia">
              <header className="semana-dia-header">
                <h3>{DIAS_LABEL[d]}</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => abrirNuevo(d)}>
                  +
                </button>
              </header>
              <div className="semana-dia-slots">
                {slotsDia.length === 0 ? (
                  <p className="text-muted form-vacio" style={{ padding: 12 }}>Sin slots.</p>
                ) : (
                  slotsDia.map(s => (
                    <button
                      key={s.id}
                      className="slot-card"
                      onClick={() => abrirEditar(s)}
                      type="button"
                    >
                      <div className="slot-card-hora">
                        {s.hora_inicio.slice(0, 5)} – {s.hora_fin.slice(0, 5)}
                      </div>
                      <div className="slot-card-act">{s.actividad?.nombre ?? '—'}</div>
                      <div className="slot-card-grupo">
                        {s.grupo?.nombre} <span className="text-muted">({s.grupo?.edad_min}–{s.grupo?.edad_max})</span>
                      </div>
                      <div className="slot-card-meta">
                        <span>👥 {s.cupo}</span>
                        {s.personal && <span>· {s.personal.nombre} {s.personal.apellido}</span>}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      <SlotFormModal
        slot={editando}
        semanaId={semana.id}
        clubId={semana.club_id}
        diaPredet={diaPredet}
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onGuardado={() => { setModalAbierto(false); cargar() }}
        onEliminar={s => { setModalAbierto(false); setEliminando(s) }}
      />

      {eliminando && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setEliminando(null); setErrorEliminar('') } }}>
          <div className="modal modal-confirm" role="dialog" aria-modal="true">
            <h2>¿Eliminar slot?</h2>
            <p className="text-muted">
              {DIAS_LABEL[eliminando.dia]} · {eliminando.hora_inicio.slice(0,5)}–{eliminando.hora_fin.slice(0,5)} ·{' '}
              <strong>{eliminando.actividad?.nombre}</strong>
            </p>
            {errorEliminar && <p className="error-msg">{errorEliminar}</p>}
            <div className="form-acciones">
              <button className="btn btn-secondary" onClick={() => { setEliminando(null); setErrorEliminar('') }}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={() => eliminar(eliminando)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
