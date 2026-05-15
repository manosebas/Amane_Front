import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import type { Grupo } from '../../types/grupo'

const BACKEND = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '')

type Props = {
  grupo: Grupo | null
  open: boolean
  onClose: () => void
  onGuardado: () => void
  onEliminar?: (grupo: Grupo) => void
}

export function GrupoFormModal({ grupo, open, onClose, onGuardado, onEliminar }: Props) {
  const [nombre, setNombre] = useState('')
  const [edadMin, setEdadMin] = useState<number | ''>('')
  const [edadMax, setEdadMax] = useState<number | ''>('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const editando = !!grupo

  useEffect(() => {
    if (!open) return
    setNombre(grupo?.nombre ?? '')
    setEdadMin(grupo?.edad_min ?? '')
    setEdadMax(grupo?.edad_max ?? '')
    setError('')
  }, [open, grupo])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { setError('El nombre es requerido.'); return }
    if (edadMin === '' || edadMax === '') { setError('Las edades son requeridas.'); return }
    if (Number(edadMax) < Number(edadMin)) { setError('La edad máxima debe ser ≥ la mínima.'); return }
    setError('')
    setGuardando(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const url = editando
        ? `${BACKEND}/api/admin/grupos/${grupo!.id}`
        : `${BACKEND}/api/admin/grupos`
      const res = await fetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ nombre, edad_min: edadMin, edad_max: edadMax }),
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
          <h2>{editando ? 'Editar grupo' : 'Nuevo grupo'}</h2>
          <button className="modal-close" onClick={onClose} disabled={guardando} aria-label="Cerrar">×</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="grp-nombre">Nombre del grupo</label>
            <input
              id="grp-nombre" type="text"
              value={nombre} onChange={e => setNombre(e.target.value)}
              required maxLength={100} autoFocus
              placeholder="Ej. Pequeños"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="grp-min">Edad mínima</label>
              <input
                id="grp-min" type="number" min={0} max={99}
                value={edadMin}
                onChange={e => setEdadMin(e.target.value === '' ? '' : Number(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="grp-max">Edad máxima</label>
              <input
                id="grp-max" type="number" min={0} max={99}
                value={edadMax}
                onChange={e => setEdadMax(e.target.value === '' ? '' : Number(e.target.value))}
                required
              />
            </div>
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div className="form-acciones">
            {editando && onEliminar && grupo && (
              <button type="button" className="btn-eliminar-form" onClick={() => onEliminar(grupo)} disabled={guardando}>
                Eliminar grupo
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
