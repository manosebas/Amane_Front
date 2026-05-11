import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { IconoAuto } from './IconoAuto'
import type { Categoria } from '../../types/actividad'

const BACKEND = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '')

type Props = {
  categoria: Categoria | null
  open: boolean
  onClose: () => void
  onGuardado: () => void
}

export function CategoriaFormModal({ categoria, open, onClose, onGuardado }: Props) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const editando = !!categoria

  useEffect(() => {
    if (!open) return
    setNombre(categoria?.nombre ?? '')
    setDescripcion(categoria?.descripcion ?? '')
    setError('')
  }, [open, categoria])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre es requerido.')
      return
    }
    setError('')
    setGuardando(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const url = editando
        ? `${BACKEND}/api/admin/categorias/${categoria!.id}`
        : `${BACKEND}/api/admin/categorias`
      const res = await fetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ nombre, descripcion }),
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
          <h2>{editando ? 'Editar categoría' : 'Nueva categoría'}</h2>
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
            <label htmlFor="cat-nombre">Nombre</label>
            <input
              id="cat-nombre" type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required maxLength={100}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="cat-descripcion">Descripción</label>
            <textarea
              id="cat-descripcion"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={3} maxLength={500}
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div className="form-acciones">
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
