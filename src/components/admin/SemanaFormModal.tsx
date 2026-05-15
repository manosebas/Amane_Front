import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import type { Semana } from '../../types/semana'

const BACKEND = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '')

type Modo = 'crear' | 'editar' | 'clonar'

type Props = {
  modo: Modo
  semana: Semana | null
  clubId: string
  open: boolean
  onClose: () => void
  onGuardado: () => void
}

export function SemanaFormModal({ modo, semana, clubId, open, onClose, onGuardado }: Props) {
  const [nombre, setNombre] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!open) return
    setNombre(modo === 'editar' ? (semana?.nombre ?? '') : '')
    setFechaInicio(modo === 'editar' ? (semana?.fecha_inicio ?? '') : '')
    setFechaFin(modo === 'editar' ? (semana?.fecha_fin ?? '') : '')
    setError('')
  }, [open, modo, semana])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!fechaInicio || !fechaFin) { setError('Las fechas son requeridas.'); return }
    if (fechaFin < fechaInicio) { setError('Fecha fin debe ser ≥ fecha inicio.'); return }

    setGuardando(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      let url = `${BACKEND}/api/admin/semanas`
      let method: 'POST' | 'PATCH' = 'POST'
      let body: Record<string, unknown> = {
        club_id: clubId,
        nombre,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      }

      if (modo === 'editar' && semana) {
        url = `${BACKEND}/api/admin/semanas/${semana.id}`
        method = 'PATCH'
        body = { nombre, fecha_inicio: fechaInicio, fecha_fin: fechaFin }
      } else if (modo === 'clonar' && semana) {
        url = `${BACKEND}/api/admin/semanas/${semana.id}/clonar`
        method = 'POST'
        body = { nombre, fecha_inicio: fechaInicio, fecha_fin: fechaFin }
      }

      const res = await fetch(url, {
        method,
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

  const titulo = modo === 'crear' ? 'Nueva semana' : modo === 'editar' ? 'Editar semana' : 'Clonar semana'

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !guardando) onClose() }}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{titulo}</h2>
          <button className="modal-close" onClick={onClose} disabled={guardando}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="sem-nombre">Nombre (opcional)</label>
            <input
              id="sem-nombre" type="text"
              value={nombre} onChange={e => setNombre(e.target.value)}
              maxLength={100}
              placeholder="Ej. Semana 1"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sem-inicio">Fecha inicio</label>
              <input
                id="sem-inicio" type="date"
                value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="sem-fin">Fecha fin</label>
              <input
                id="sem-fin" type="date"
                value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                required
              />
            </div>
          </div>

          {modo === 'clonar' && (
            <p className="text-muted">Se copiarán todos los slots de la semana origen. Las inscripciones no se clonan.</p>
          )}

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
