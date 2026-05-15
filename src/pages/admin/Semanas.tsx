import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { SemanaFormModal } from '../../components/admin/SemanaFormModal'
import type { Club } from '../../types/club'
import type { Semana } from '../../types/semana'

const BACKEND = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '')

type Modo = 'crear' | 'editar' | 'clonar'

export default function Semanas() {
  const [clubes, setClubes] = useState<Club[]>([])
  const [clubId, setClubId] = useState<string>('')
  const [semanas, setSemanas] = useState<Semana[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [modo, setModo] = useState<Modo>('crear')
  const [semanaRef, setSemanaRef] = useState<Semana | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)

  const [eliminando, setEliminando] = useState<Semana | null>(null)
  const [errorEliminar, setErrorEliminar] = useState('')

  const cargarClubes = useCallback(async () => {
    setError('')
    try {
      const res = await api('/api/admin/clubes')
      const data = await res.json().catch(() => null)
      if (!res.ok) setError(data?.error ?? 'Error al cargar clubes.')
      else {
        const cs = data?.clubes ?? []
        setClubes(cs)
        if (cs.length > 0 && !clubId) setClubId(cs[0].id)
      }
    } catch {
      setError('Error de conexión.')
    }
  }, [clubId])

  const cargarSemanas = useCallback(async (cid: string) => {
    if (!cid) { setSemanas([]); setCargando(false); return }
    setCargando(true)
    try {
      const res = await api(`/api/admin/semanas?club_id=${cid}`)
      const data = await res.json().catch(() => null)
      if (res.ok) setSemanas(data?.semanas ?? [])
    } catch {
      setError('Error de conexión.')
    }
    setCargando(false)
  }, [])

  useEffect(() => { cargarClubes() }, [cargarClubes])
  useEffect(() => { if (clubId) cargarSemanas(clubId) }, [clubId, cargarSemanas])

  async function cambiarEstado(s: Semana, nuevo: 'borrador' | 'activa') {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${BACKEND}/api/admin/semanas/${s.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ estado: nuevo }),
      })
      if (res.ok) cargarSemanas(clubId)
    } catch {
      // ignore
    }
  }

  async function eliminar(s: Semana) {
    setErrorEliminar('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${BACKEND}/api/admin/semanas/${s.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { setErrorEliminar(data?.error ?? 'Error al eliminar.'); return }
      setEliminando(null)
      cargarSemanas(clubId)
    } catch {
      setErrorEliminar('Error de conexión.')
    }
  }

  function abrirModal(m: Modo, s: Semana | null) {
    setModo(m); setSemanaRef(s); setModalAbierto(true)
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-titulo">Semanas</h1>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => abrirModal('crear', null)}
          disabled={!clubId}
        >
          + Nueva semana
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {clubes.length === 0 ? (
        <p className="text-muted">Crea al menos un club primero.</p>
      ) : (
        <>
          <div className="filtros">
            <label htmlFor="filtro-club-sem">Club</label>
            <select id="filtro-club-sem" value={clubId} onChange={e => setClubId(e.target.value)}>
              {clubes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          {cargando ? (
            <div className="text-muted">Cargando...</div>
          ) : semanas.length === 0 ? (
            <div className="admin-empty">
              <p>Sin semanas creadas para este club.</p>
            </div>
          ) : (
            <table className="admin-tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Fechas</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {semanas.map(s => (
                  <tr key={s.id}>
                    <td>
                      <Link to={`/admin/semanas/${s.id}`}>{s.nombre || 'Sin nombre'}</Link>
                    </td>
                    <td>{s.fecha_inicio} → {s.fecha_fin}</td>
                    <td>
                      <span className={`badge badge-${s.estado === 'activa' ? 'activo' : 'inactivo'}`}>
                        {s.estado}
                      </span>
                    </td>
                    <td className="acciones-cell">
                      {s.estado === 'borrador' ? (
                        <button className="btn btn-primary btn-sm" onClick={() => cambiarEstado(s, 'activa')}>
                          Activar
                        </button>
                      ) : (
                        <button className="btn btn-secondary btn-sm" onClick={() => cambiarEstado(s, 'borrador')}>
                          Pasar a borrador
                        </button>
                      )}
                      <button className="btn btn-secondary btn-sm" onClick={() => abrirModal('editar', s)}>
                        Editar
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => abrirModal('clonar', s)}>
                        Clonar
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => setEliminando(s)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      <SemanaFormModal
        modo={modo}
        semana={semanaRef}
        clubId={clubId}
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onGuardado={() => { setModalAbierto(false); cargarSemanas(clubId) }}
      />

      {eliminando && (
        <div
          className="modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) { setEliminando(null); setErrorEliminar('') } }}
        >
          <div className="modal modal-confirm" role="dialog" aria-modal="true">
            <h2>¿Eliminar semana?</h2>
            <p className="text-muted">
              Vas a eliminar la semana <strong>{eliminando.fecha_inicio} → {eliminando.fecha_fin}</strong>.
              Se eliminarán también todos sus slots.
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
