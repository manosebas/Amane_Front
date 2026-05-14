import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { IconoAuto } from './IconoAuto'
import type { Actividad, Categoria } from '../../types/actividad'

const BACKEND = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '')

type Props = {
  actividad: Actividad | null
  categorias: Categoria[]
  open: boolean
  onClose: () => void
  onGuardado: () => void
  onEliminar?: (actividad: Actividad) => void
}

export function ActividadFormModal({ actividad, categorias, open, onClose, onGuardado, onEliminar }: Props) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const editando = !!actividad

  useEffect(() => {
    if (!open) return
    setNombre(actividad?.nombre ?? '')
    setDescripcion(actividad?.descripcion ?? '')
    setCategoriaId(actividad?.categoria_id ?? categorias[0]?.id ?? '')
    setError('')
  }, [open, actividad, categorias])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre es requerido.')
      return
    }
    if (!categoriaId) {
      setError('Selecciona una categoría.')
      return
    }
    setError('')
    setGuardando(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const url = editando
        ? `${BACKEND}/api/admin/actividades/${actividad!.id}`
        : `${BACKEND}/api/admin/actividades`
      const res = await fetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ nombre, descripcion, categoria_id: categoriaId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error ?? `Error del servidor (${res.status}).`)
      } else {
        onGuardado()
      }
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
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
          <h2>{editando ? 'Editar actividad' : 'Nueva actividad'}</h2>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={guardando}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="icono-preview">
            <IconoAuto nombre={nombre || '?'} size="lg" />
            <span className="icono-preview-label">Icono generado automáticamente</span>
          </div>

          <div className="form-group">
            <label htmlFor="act-categoria">Categoría</label>
            <select
              id="act-categoria"
              value={categoriaId}
              onChange={e => setCategoriaId(e.target.value)}
              required
            >
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="act-nombre">Nombre</label>
            <input
              id="act-nombre" type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required maxLength={100}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="act-descripcion">Descripción</label>
            <textarea
              id="act-descripcion"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={3} maxLength={500}
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div className="form-acciones">
            {editando && onEliminar && actividad && (
              <button
                type="button"
                className="btn-eliminar-form"
                onClick={() => onEliminar(actividad)}
                disabled={guardando}
              >
                Eliminar actividad
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
