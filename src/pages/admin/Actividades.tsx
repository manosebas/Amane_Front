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
                    <IconoAuto nombre={cat.nombre} size="md" />
                    <div className="categoria-card-body">
                      <h3 className="categoria-card-nombre">{cat.nombre}</h3>
                      {cat.descripcion && (
                        <p className="categoria-card-desc">{cat.descripcion}</p>
                      )}
                    </div>
                    <div className="categoria-card-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setCatEditando(cat); setModalCatAbierto(true) }}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setEliminandoCat(cat)}
                      >
                        Eliminar
                      </button>
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
            ) : actividades.length === 0 ? (
              <div className="admin-empty">
                <p>Sin actividades. Agrega la primera.</p>
              </div>
            ) : (
              <div className="actividades-grid">
                {actividades.map(act => (
                  <article key={act.id} className="actividad-card">
                    <IconoAuto nombre={act.nombre} size="md" />
                    <div className="actividad-card-body">
                      <h3 className="actividad-card-nombre">{act.nombre}</h3>
                      {act.descripcion && (
                        <p className="actividad-card-desc">{act.descripcion}</p>
                      )}
                      {act.categoria && (
                        <span className="actividad-card-categoria">
                          {act.categoria.nombre}
                        </span>
                      )}
                    </div>
                    <div className="actividad-card-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setActEditando(act); setModalActAbierto(true) }}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setEliminandoAct(act)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))}
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
      />

      <ActividadFormModal
        actividad={actEditando}
        categorias={categorias}
        open={modalActAbierto}
        onClose={() => setModalActAbierto(false)}
        onGuardado={() => { setModalActAbierto(false); cargar() }}
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
