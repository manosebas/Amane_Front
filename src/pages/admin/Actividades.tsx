import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { IconoAuto } from '../../components/admin/IconoAuto'
import { CategoriaFormModal } from '../../components/admin/CategoriaFormModal'
import { ActividadFormModal } from '../../components/admin/ActividadFormModal'
import type { Categoria, Actividad } from '../../types/actividad'

const BACKEND = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '')

export default function Actividades() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [modalCatAbierto, setModalCatAbierto] = useState(false)
  const [catEditando, setCatEditando] = useState<Categoria | null>(null)
  const [eliminandoCat, setEliminandoCat] = useState<Categoria | null>(null)

  const [modalActAbierto, setModalActAbierto] = useState(false)
  const [actEditando, setActEditando] = useState<Actividad | null>(null)
  const [eliminandoAct, setEliminandoAct] = useState<Actividad | null>(null)

  const [errorEliminar, setErrorEliminar] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const [catsRes, actsRes] = await Promise.all([
        api('/api/admin/categorias'),
        api('/api/admin/actividades'),
      ])
      const cats = await catsRes.json().catch(() => null)
      const acts = await actsRes.json().catch(() => null)
      if (!catsRes.ok) setError(cats?.error ?? 'Error al cargar categorías.')
      else setCategorias(cats?.categorias ?? [])
      if (actsRes.ok) setActividades(acts?.actividades ?? [])
    } catch {
      setError('Error de conexión.')
    }
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function eliminarRecurso(url: string, onSuccess: () => void) {
    setErrorEliminar('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setErrorEliminar(data?.error ?? 'Error al eliminar.')
        return
      }
      onSuccess()
      cargar()
    } catch {
      setErrorEliminar('Error de conexión.')
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-titulo">Actividades</h1>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {cargando ? (
        <div className="text-muted">Cargando...</div>
      ) : (
        <>
          <section className="admin-seccion">
            <div className="admin-seccion-header">
              <h2 className="admin-seccion-titulo">Categorías</h2>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { setCatEditando(null); setModalCatAbierto(true) }}
              >
                + Nueva categoría
              </button>
            </div>

            {categorias.length === 0 ? (
              <div className="admin-empty">
                <p>Sin categorías. Crea la primera para empezar.</p>
              </div>
            ) : (
              <div className="categorias-grid">
                {categorias.map(cat => (
                  <article key={cat.id} className="categoria-card">
                    <button
                      type="button"
                      className="card-edit-btn"
                      onClick={() => { setCatEditando(cat); setModalCatAbierto(true) }}
                      aria-label={`Editar ${cat.nombre}`}
                      title="Editar"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <IconoAuto nombre={cat.nombre} size="md" />
                    <div className="categoria-card-body">
                      <h3 className="categoria-card-nombre">{cat.nombre}</h3>
                      {cat.descripcion && (
                        <p className="categoria-card-desc">{cat.descripcion}</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="admin-seccion">
            <div className="admin-seccion-header">
              <h2 className="admin-seccion-titulo">Actividades</h2>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { setActEditando(null); setModalActAbierto(true) }}
                disabled={categorias.length === 0}
                title={categorias.length === 0 ? 'Crea una categoría primero' : undefined}
              >
                + Nueva actividad
              </button>
            </div>

            {categorias.length === 0 ? (
              <p className="text-muted">Crea al menos una categoría antes de agregar actividades.</p>
            ) : (
              <div className="actividades-tablero">
                {categorias.map(cat => {
                  const acts = actividades.filter(a => a.categoria_id === cat.id)
                  return (
                    <div key={cat.id} className="actividades-columna">
                      <header className="actividades-columna-header">
                        <IconoAuto nombre={cat.nombre} size="sm" />
                        <h3 className="actividades-columna-titulo">{cat.nombre}</h3>
                        <span className="actividades-columna-count">{acts.length}</span>
                      </header>
                      <div className="actividades-columna-lista">
                        {acts.length === 0 ? (
                          <p className="actividades-columna-vacia">Sin actividades</p>
                        ) : (
                          acts.map(act => (
                            <article key={act.id} className="actividad-card-compacta">
                              <div className="actividad-card-compacta-row">
                                <IconoAuto nombre={act.nombre} size="sm" />
                                <span className="actividad-card-compacta-nombre">{act.nombre}</span>
                                <button
                                  type="button"
                                  className="card-edit-btn card-edit-btn-inline"
                                  onClick={() => { setActEditando(act); setModalActAbierto(true) }}
                                  aria-label={`Editar ${act.nombre}`}
                                  title="Editar"
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                              </div>
                              {act.descripcion && (
                                <p className="actividad-card-compacta-desc">{act.descripcion}</p>
                              )}
                            </article>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}

      <CategoriaFormModal
        categoria={catEditando}
        open={modalCatAbierto}
        onClose={() => setModalCatAbierto(false)}
        onGuardado={() => { setModalCatAbierto(false); cargar() }}
        onEliminar={cat => { setModalCatAbierto(false); setEliminandoCat(cat) }}
      />

      <ActividadFormModal
        actividad={actEditando}
        categorias={categorias}
        open={modalActAbierto}
        onClose={() => setModalActAbierto(false)}
        onGuardado={() => { setModalActAbierto(false); cargar() }}
        onEliminar={act => { setModalActAbierto(false); setEliminandoAct(act) }}
      />

      {eliminandoCat && (
        <div
          className="modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) { setEliminandoCat(null); setErrorEliminar('') } }}
        >
          <div className="modal modal-confirm" role="dialog" aria-modal="true">
            <h2>¿Eliminar categoría?</h2>
            <p className="text-muted">
              Vas a eliminar <strong>{eliminandoCat.nombre}</strong>. Esta acción no se puede deshacer.
            </p>
            {errorEliminar && <p className="error-msg">{errorEliminar}</p>}
            <div className="form-acciones">
              <button
                className="btn btn-secondary"
                onClick={() => { setEliminandoCat(null); setErrorEliminar('') }}
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={() => eliminarRecurso(
                  `${BACKEND}/api/admin/categorias/${eliminandoCat.id}`,
                  () => setEliminandoCat(null)
                )}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {eliminandoAct && (
        <div
          className="modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) { setEliminandoAct(null); setErrorEliminar('') } }}
        >
          <div className="modal modal-confirm" role="dialog" aria-modal="true">
            <h2>¿Eliminar actividad?</h2>
            <p className="text-muted">
              Vas a eliminar <strong>{eliminandoAct.nombre}</strong>.
            </p>
            {errorEliminar && <p className="error-msg">{errorEliminar}</p>}
            <div className="form-acciones">
              <button
                className="btn btn-secondary"
                onClick={() => { setEliminandoAct(null); setErrorEliminar('') }}
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={() => eliminarRecurso(
                  `${BACKEND}/api/admin/actividades/${eliminandoAct.id}`,
                  () => setEliminandoAct(null)
                )}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
