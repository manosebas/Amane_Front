import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { PersonalFormModal } from '../../components/admin/PersonalFormModal'
import type { Club } from '../../types/club'
import type { Personal } from '../../types/personal'

const BACKEND = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '')

export default function PersonalPage() {
  const [clubes, setClubes] = useState<Club[]>([])
  const [personal, setPersonal] = useState<Personal[]>([])
  const [clubFiltro, setClubFiltro] = useState<string>('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Personal | null>(null)
  const [eliminando, setEliminando] = useState<Personal | null>(null)
  const [errorEliminar, setErrorEliminar] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const [clubesRes, persRes] = await Promise.all([
        api('/api/admin/clubes'),
        api('/api/admin/personal'),
      ])
      const clubesData = await clubesRes.json().catch(() => null)
      const persData = await persRes.json().catch(() => null)
      if (!clubesRes.ok) setError(clubesData?.error ?? 'Error al cargar clubes.')
      else setClubes(clubesData?.clubes ?? [])
      if (persRes.ok) setPersonal(persData?.personal ?? [])
    } catch {
      setError('Error de conexión.')
    }
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function eliminar(p: Personal) {
    setErrorEliminar('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${BACKEND}/api/admin/personal/${p.id}`, {
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

  const visibles = clubFiltro
    ? personal.filter(p => p.club_id === clubFiltro)
    : personal

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-titulo">Personal</h1>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => { setEditando(null); setModalAbierto(true) }}
          disabled={clubes.length === 0}
          title={clubes.length === 0 ? 'Crea un club primero' : undefined}
        >
          + Nuevo personal
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {cargando ? (
        <div className="text-muted">Cargando...</div>
      ) : clubes.length === 0 ? (
        <p className="text-muted">Crea al menos un club antes de agregar personal.</p>
      ) : (
        <>
          <div className="filtros">
            <label htmlFor="filtro-club">Filtrar por club</label>
            <select id="filtro-club" value={clubFiltro} onChange={e => setClubFiltro(e.target.value)}>
              <option value="">Todos</option>
              {clubes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          {visibles.length === 0 ? (
            <div className="admin-empty">
              <p>Sin personal{clubFiltro ? ' en este club' : ''}.</p>
            </div>
          ) : (
            <table className="admin-tabla">
              <thead>
                <tr>
                  <th>Nombre</th><th>Cédula</th><th>Rol</th><th>Club</th><th></th>
                </tr>
              </thead>
              <tbody>
                {visibles.map(p => (
                  <tr key={p.id}>
                    <td>{p.nombre} {p.apellido}</td>
                    <td>{p.cedula}</td>
                    <td>{p.rol === 'profesor' ? 'Profesor' : 'Mate'}</td>
                    <td>{p.club?.nombre ?? '—'}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setEditando(p); setModalAbierto(true) }}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      <PersonalFormModal
        personal={editando}
        clubes={clubes}
        clubIdInicial={clubFiltro || undefined}
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onGuardado={() => { setModalAbierto(false); cargar() }}
        onEliminar={p => { setModalAbierto(false); setEliminando(p) }}
      />

      {eliminando && (
        <div
          className="modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) { setEliminando(null); setErrorEliminar('') } }}
        >
          <div className="modal modal-confirm" role="dialog" aria-modal="true">
            <h2>¿Eliminar personal?</h2>
            <p className="text-muted">
              Vas a eliminar <strong>{eliminando.nombre} {eliminando.apellido}</strong>.
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
