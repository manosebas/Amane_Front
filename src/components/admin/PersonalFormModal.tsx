import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import type { Club } from '../../types/club'
import type { Personal, RolPersonal } from '../../types/personal'

const BACKEND = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '')

type Props = {
  personal: Personal | null
  clubes: Club[]
  clubIdInicial?: string
  open: boolean
  onClose: () => void
  onGuardado: () => void
  onEliminar?: (p: Personal) => void
}

export function PersonalFormModal({ personal, clubes, clubIdInicial, open, onClose, onGuardado, onEliminar }: Props) {
  const [clubId, setClubId] = useState('')
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [cedula, setCedula] = useState('')
  const [rol, setRol] = useState<RolPersonal>('profesor')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const editando = !!personal

  useEffect(() => {
    if (!open) return
    setClubId(personal?.club_id ?? clubIdInicial ?? clubes[0]?.id ?? '')
    setNombre(personal?.nombre ?? '')
    setApellido(personal?.apellido ?? '')
    setCedula(personal?.cedula ?? '')
    setRol(personal?.rol ?? 'profesor')
    setError('')
  }, [open, personal, clubIdInicial, clubes])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!clubId) { setError('Selecciona un club.'); return }
    if (!nombre.trim() || !apellido.trim() || !cedula.trim()) {
      setError('Todos los campos son requeridos.'); return
    }
    setError('')
    setGuardando(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const url = editando
        ? `${BACKEND}/api/admin/personal/${personal!.id}`
        : `${BACKEND}/api/admin/personal`
      const res = await fetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ club_id: clubId, nombre, apellido, cedula, rol }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) setError(data?.error ?? `Error del servidor (${res.status}).`)
      else onGuardado()
    } catch {
      setError('Error de conexión.')
    }
    setGuardando(false)
  }

  if (!open) return null

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget && !guardando) onClose() }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{editando ? 'Editar personal' : 'Nuevo personal'}</h2>
          <button className="modal-close" onClick={onClose} disabled={guardando} aria-label="Cerrar">×</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="per-club">Club</label>
            <select
              id="per-club" value={clubId}
              onChange={e => setClubId(e.target.value)}
              required
            >
              <option value="" disabled>Selecciona…</option>
              {clubes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="per-nombre">Nombre</label>
              <input id="per-nombre" type="text" value={nombre} onChange={e => setNombre(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="per-apellido">Apellido</label>
              <input id="per-apellido" type="text" value={apellido} onChange={e => setApellido(e.target.value)} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="per-cedula">Cédula</label>
              <input id="per-cedula" type="text" value={cedula} onChange={e => setCedula(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="per-rol">Rol</label>
              <select id="per-rol" value={rol} onChange={e => setRol(e.target.value as RolPersonal)}>
                <option value="profesor">Profesor</option>
                <option value="mate">Mate</option>
              </select>
            </div>
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div className="form-acciones">
            {editando && onEliminar && personal && (
              <button type="button" className="btn-eliminar-form" onClick={() => onEliminar(personal)} disabled={guardando}>
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
