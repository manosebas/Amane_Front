import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Nino } from '../types/nino'

const BACKEND = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '')

type Props = {
  nino: Nino | null
  open: boolean
  onClose: () => void
  onGuardado: () => void
  onEliminar?: (n: Nino) => void
}

export function NinoFormModal({ nino, open, onClose, onGuardado, onEliminar }: Props) {
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [fecha, setFecha] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const editando = !!nino

  useEffect(() => {
    if (!open) return
    setNombre(nino?.nombre ?? '')
    setApellido(nino?.apellido ?? '')
    setFecha(nino?.fecha_nacimiento ?? '')
    setError('')
  }, [open, nino])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !apellido.trim() || !fecha) {
      setError('Todos los campos son requeridos.'); return
    }
    setGuardando(true); setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const url = editando
        ? `${BACKEND}/api/ninos/${nino!.id}`
        : `${BACKEND}/api/ninos`
      const res = await fetch(url, {
        method: editando ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ nombre, apellido, fecha_nacimiento: fecha }),
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
          <h2>{editando ? 'Editar niño' : 'Registrar niño'}</h2>
          <button className="modal-close" onClick={onClose} disabled={guardando}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nino-nombre">Nombre</label>
              <input id="nino-nombre" type="text" value={nombre} onChange={e => setNombre(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="nino-apellido">Apellido</label>
              <input id="nino-apellido" type="text" value={apellido} onChange={e => setApellido(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="nino-fecha">Fecha de nacimiento</label>
            <input id="nino-fecha" type="date" value={fecha} onChange={e => setFecha(e.target.value)} required />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div className="form-acciones">
            {editando && onEliminar && nino && (
              <button type="button" className="btn-eliminar-form" onClick={() => onEliminar(nino)} disabled={guardando}>
                Eliminar
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
