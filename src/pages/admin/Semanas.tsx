import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { SemanaFormModal } from '../../components/admin/SemanaFormModal'
import type { Club } from '../../types/club'
import type { Semana } from '../../types/semana'

const BACKEND = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '')

type Modo = 'crear' | 'editar' | 'clonar'

const SVG_PROPS = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}
const IconPlay = () => (
  <svg {...SVG_PROPS}><polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none" /></svg>
)
const IconPause = () => (
  <svg {...SVG_PROPS}><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" /><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" /></svg>
)
const IconPencil = () => (
  <svg {...SVG_PROPS}><path d="M4 20h4l10-10-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" /></svg>
)
const IconCopy = () => (
  <svg {...SVG_PROPS}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></svg>
)
const IconTrash = () => (
  <svg {...SVG_PROPS}><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
)

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

  type Toast = { id: number; msg: string; tipo: 'error' | 'warning' | 'success' }
  const [toasts, setToasts] = useState<Toast[]>([])
  function mostrarToast(msg: string, tipo: Toast['tipo'] = 'error') {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, msg, tipo }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 6000)
  }

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
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        mostrarToast(data?.error ?? 'No se pudo cambiar el estado de la semana.', 'error')
        return
      }
      if (data?.warning) mostrarToast(data.warning, 'warning')
      else if (nuevo === 'activa') mostrarToast('Semana activada.', 'success')
      cargarSemanas(clubId)
    } catch {
      mostrarToast('Error de conexión.', 'error')
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
                      <span className={`estado-pill estado-${s.estado === 'activa' ? 'activa' : 'borrador'}`}>
                        <span className="estado-dot" aria-hidden="true" />
                        {s.estado === 'activa' ? 'Activa' : 'Borrador'}
                      </span>
                    </td>
                    <td className="acciones-cell">
                      {s.estado === 'borrador' ? (
                        <button
                          type="button"
                          className="btn-icon btn-icon-success"
                          onClick={() => cambiarEstado(s, 'activa')}
                          title="Activar"
                          aria-label="Activar"
                        >
                          <IconPlay />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-icon btn-icon-warning"
                          onClick={() => cambiarEstado(s, 'borrador')}
                          title="Inactivar"
                          aria-label="Inactivar"
                        >
                          <IconPause />
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => abrirModal('editar', s)}
                        title="Editar"
                        aria-label="Editar"
                      >
                        <IconPencil />
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => abrirModal('clonar', s)}
                        title="Clonar"
                        aria-label="Clonar"
                      >
                        <IconCopy />
                      </button>
                      <button
                        type="button"
                        className="btn-icon btn-icon-danger"
                        onClick={() => setEliminando(s)}
                        title="Eliminar"
                        aria-label="Eliminar"
                      >
                        <IconTrash />
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

      {toasts.length > 0 && (
        <div className="toast-stack" role="status" aria-live="polite">
          {toasts.map(t => (
            <div key={t.id} className={`toast toast-${t.tipo}`}>{t.msg}</div>
          ))}
        </div>
      )}

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
