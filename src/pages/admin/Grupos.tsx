import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { GrupoFormModal } from '../../components/admin/GrupoFormModal'
import type { Grupo } from '../../types/grupo'

const BACKEND = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '')

export default function Grupos() {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Grupo | null>(null)
  const [eliminando, setEliminando] = useState<Grupo | null>(null)
  const [errorEliminar, setErrorEliminar] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const res = await api('/api/admin/grupos')
      const data = await res.json().catch(() => null)
      if (!res.ok) setError(data?.error ?? 'Error al cargar grupos.')
      else setGrupos(data?.grupos ?? [])
    } catch {
      setError('Error de conexión.')
    }
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function eliminar(grupo: Grupo) {
    setErrorEliminar('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${BACKEND}/api/admin/grupos/${grupo.id}`, {
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

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-titulo">Grupos</h1>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditando(null); setModalAbierto(true) }}>
          + Nuevo grupo
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {cargando ? (
        <div className="text-muted">Cargando...</div>
      ) : grupos.length === 0 ? (
        <div className="admin-empty">
          <p>Sin grupos. Crea el primero para empezar.</p>
        </div>
      ) : (
        <div className="categorias-grid">
          {grupos.map(g => (
            <article key={g.id} className="categoria-card">
              <button
                type="button"
                className="card-edit-btn"
                onClick={() => { setEditando(g); setModalAbierto(true) }}
                aria-label={`Editar ${g.nombre}`}
                title="Editar"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <div className="categoria-card-body">
                <h3 className="categoria-card-nombre">{g.nombre}</h3>
                <p className="categoria-card-desc">{g.edad_min} – {g.edad_max} años</p>
              </div>
            </article>
          ))}
        </div>
      )}

      <GrupoFormModal
        grupo={editando}
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onGuardado={() => { setModalAbierto(false); cargar() }}
        onEliminar={g => { setModalAbierto(false); setEliminando(g) }}
      />

      {eliminando && (
        <div
          className="modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) { setEliminando(null); setErrorEliminar('') } }}
        >
          <div className="modal modal-confirm" role="dialog" aria-modal="true">
            <h2>¿Eliminar grupo?</h2>
            <p className="text-muted">
              Vas a eliminar <strong>{eliminando.nombre}</strong>. Esta acción no se puede deshacer.
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
