import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { ClubCard } from '../../components/admin/ClubCard'
import { ClubFormModal } from '../../components/admin/ClubFormModal'
import type { Club } from '../../types/club'

export default function Clubes() {
  const [clubes, setClubes] = useState<Club[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [clubEditando, setClubEditando] = useState<Club | null>(null)
  const [eliminando, setEliminando] = useState<Club | null>(null)
  const [errorEliminar, setErrorEliminar] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const res = await api('/api/admin/clubes')
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error ?? `Error del servidor (${res.status}).`)
      } else {
        setClubes(data.clubes ?? [])
      }
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    }
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  function abrirNuevo() {
    setClubEditando(null)
    setModalAbierto(true)
  }

  function abrirEditar(club: Club) {
    setClubEditando(club)
    setModalAbierto(true)
  }

  function cerrarModal() {
    setModalAbierto(false)
    setClubEditando(null)
  }

  async function confirmarEliminar() {
    if (!eliminando) return
    setErrorEliminar('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${(import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '')}/api/admin/clubes/${eliminando.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session?.access_token}` },
        }
      )
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setErrorEliminar(data?.error ?? 'Error al eliminar.')
        return
      }
      setEliminando(null)
      cargar()
    } catch {
      setErrorEliminar('Error de conexión.')
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-titulo">Clubes</h1>
        <button className="btn btn-primary" onClick={abrirNuevo}>
          + Nuevo club
        </button>
      </div>

      {cargando ? (
        <div className="text-muted">Cargando clubes...</div>
      ) : error ? (
        <div className="error-msg">{error}</div>
      ) : clubes.length === 0 ? (
        <div className="admin-empty">
          <p>Aún no hay clubes. Crea el primero para empezar.</p>
          <button className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo club</button>
        </div>
      ) : (
        <div className="clubes-admin-grid">
          {clubes.map(club => (
            <ClubCard
              key={club.id}
              club={club}
              onEditar={abrirEditar}
              onEliminar={setEliminando}
            />
          ))}
        </div>
      )}

      <ClubFormModal
        club={clubEditando}
        open={modalAbierto}
        onClose={cerrarModal}
        onGuardado={() => { cerrarModal(); cargar() }}
      />

      {eliminando && (
        <div
          className="modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) setEliminando(null) }}
        >
          <div className="modal modal-confirm" role="dialog" aria-modal="true">
            <h2>¿Eliminar club?</h2>
            <p className="text-muted">
              Vas a eliminar <strong>{eliminando.nombre}</strong>. Esta acción no se puede deshacer.
            </p>
            {errorEliminar && <p className="error-msg">{errorEliminar}</p>}
            <div className="form-acciones">
              <button className="btn btn-secondary" onClick={() => setEliminando(null)}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={confirmarEliminar}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
