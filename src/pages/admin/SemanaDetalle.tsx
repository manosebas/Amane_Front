import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { ClaseFormModal } from '../../components/admin/ClaseFormModal'
import type { Clase } from '../../types/clase'
import type { Semana } from '../../types/semana'

const BACKEND = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '')

export default function SemanaDetalle() {
  const { id } = useParams<{ id: string }>()
  const [semana, setSemana] = useState<Semana | null>(null)
  const [clases, setClases] = useState<Clase[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Clase | null>(null)
  const [eliminando, setEliminando] = useState<Clase | null>(null)
  const [errorEliminar, setErrorEliminar] = useState('')

  const cargar = useCallback(async () => {
    if (!id) return
    setCargando(true); setError('')
    try {
      const [semRes, clasesRes] = await Promise.all([
        api(`/api/admin/semanas/${id}`),
        api(`/api/admin/clases?semana_id=${id}`),
      ])
      const semData = await semRes.json().catch(() => null)
      const clasesData = await clasesRes.json().catch(() => null)
      if (!semRes.ok) setError(semData?.error ?? 'Semana no encontrada.')
      else setSemana(semData?.semana ?? null)
      if (clasesRes.ok) setClases(clasesData?.clases ?? [])
    } catch {
      setError('Error de conexión.')
    }
    setCargando(false)
  }, [id])

  useEffect(() => { cargar() }, [cargar])

  async function eliminar(c: Clase) {
    setErrorEliminar('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${BACKEND}/api/admin/clases/${c.id}`, {
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

  if (cargando) return <div className="text-muted">Cargando...</div>
  if (error) return <div className="error-msg">{error}</div>
  if (!semana) return <div className="text-muted">Semana no encontrada.</div>

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <Link to="/admin/semanas" className="back-link">← Semanas</Link>
          <h1 className="admin-page-titulo">
            {semana.nombre || `${semana.fecha_inicio} → ${semana.fecha_fin}`}
          </h1>
          <p className="text-muted">
            {semana.fecha_inicio} → {semana.fecha_fin} ·{' '}
            <span className={`badge badge-${semana.estado === 'activa' ? 'activo' : 'inactivo'}`}>
              {semana.estado}
            </span>
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setEditando(null); setModalAbierto(true) }}
        >
          + Agregar clase
        </button>
      </div>

      {clases.length === 0 ? (
        <div className="admin-empty">
          <p>Aún no agregaste clases a esta semana.</p>
        </div>
      ) : (
        <div className="clases-lista">
          {clases.map(c => (
            <article key={c.id} className="clase-card">
              <header className="clase-card-header">
                <div>
                  <h3 className="clase-card-titulo">{c.actividad?.nombre ?? '—'}</h3>
                  {c.actividad?.categoria && (
                    <p className="text-muted clase-card-cat">{c.actividad.categoria.nombre}</p>
                  )}
                </div>
                <div className="clase-card-acciones">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setEditando(c); setModalAbierto(true) }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => setEliminando(c)}
                  >
                    Eliminar
                  </button>
                </div>
              </header>

              {c.cupos.length === 0 ? (
                <p className="text-muted">Sin grupos asignados.</p>
              ) : (
                <ul className="cupos-lista">
                  {c.cupos
                    .slice()
                    .sort((a, b) => (a.grupo?.edad_min ?? 0) - (b.grupo?.edad_min ?? 0))
                    .map(cg => (
                      <li key={cg.id} className="cupos-item">
                        <span className="cupos-grupo">
                          {cg.grupo?.nombre}{' '}
                          <span className="text-muted">
                            ({cg.grupo?.edad_min}–{cg.grupo?.edad_max})
                          </span>
                        </span>
                        <span className={`cupos-conteo ${(cg.inscritos ?? 0) >= cg.cupo ? 'cupos-lleno' : ''}`}>
                          {cg.inscritos ?? 0} / {cg.cupo}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}

      <ClaseFormModal
        clase={editando}
        semanaId={semana.id}
        clubId={semana.club_id}
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onGuardado={() => { setModalAbierto(false); cargar() }}
      />

      {eliminando && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setEliminando(null); setErrorEliminar('') } }}>
          <div className="modal modal-confirm" role="dialog" aria-modal="true">
            <h2>¿Eliminar clase?</h2>
            <p className="text-muted">
              Vas a eliminar la clase de <strong>{eliminando.actividad?.nombre}</strong>.
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
