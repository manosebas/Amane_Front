import { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import type { Nino } from '../types/nino'
import type { Semana } from '../types/semana'
import type { ActividadDisponible, MinimoDisponible } from '../types/clase'

const BACKEND = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '')

type Props = {
  nino: Nino | null
  open: boolean
  onClose: () => void
  onCambio: () => void
}

const SIN_CATEGORIA = '__sin_categoria__'

export function InscripcionesModal({ nino, open, onClose, onCambio }: Props) {
  const [semanas, setSemanas] = useState<Semana[]>([])
  const [semanaSel, setSemanaSel] = useState<Semana | null>(null)
  const [actividades, setActividades] = useState<ActividadDisponible[]>([])
  const [minimos, setMinimos] = useState<MinimoDisponible[]>([])
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set())
  const [llenasIds, setLlenasIds] = useState<Set<string>>(new Set())
  const [cargandoSemanas, setCargandoSemanas] = useState(false)
  const [cargandoActs, setCargandoActs] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cargarSemanas = useCallback(async () => {
    setCargandoSemanas(true); setError('')
    try {
      const res = await api('/api/inscripciones/semanas-activas')
      const data = await res.json().catch(() => null)
      if (!res.ok) setError(data?.error ?? 'Error al cargar semanas.')
      else setSemanas(data?.semanas ?? [])
    } catch {
      setError('Error de conexión.')
    }
    setCargandoSemanas(false)
  }, [])

  const cargarActividades = useCallback(async (semanaId: string) => {
    if (!nino) return
    setCargandoActs(true); setError('')
    try {
      const res = await api(`/api/inscripciones/actividades-disponibles/${nino.id}?semana_id=${semanaId}`)
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error ?? 'Error al cargar actividades.')
        setActividades([]); setMinimos([])
      } else {
        const acts = (data?.actividades ?? []) as ActividadDisponible[]
        setActividades(acts)
        setMinimos((data?.minimos ?? []) as MinimoDisponible[])
        // Pre-seleccionar las que el niño ya tiene inscritas
        setSeleccion(new Set(acts.filter(a => a.inscripcion_id).map(a => a.clase_grupo_id)))
      }
    } catch {
      setError('Error de conexión.')
    }
    setCargandoActs(false)
  }, [nino])

  useEffect(() => {
    if (open && nino) {
      setSemanaSel(null)
      setActividades([])
      setMinimos([])
      setSeleccion(new Set())
      setLlenasIds(new Set())
      setAviso('')
      cargarSemanas()
    }
  }, [open, nino, cargarSemanas])

  function elegirSemana(s: Semana) {
    setSemanaSel(s)
    setLlenasIds(new Set())
    setAviso('')
    cargarActividades(s.id)
  }

  function volverASemanas() {
    setSemanaSel(null)
    setActividades([])
    setMinimos([])
    setSeleccion(new Set())
    setLlenasIds(new Set())
    setAviso('')
    setError('')
  }

  function toggleActividad(a: ActividadDisponible) {
    if (guardando) return
    const lleno = a.inscritos >= a.cupo && !a.inscripcion_id
    if (lleno || llenasIds.has(a.clase_grupo_id)) return
    setSeleccion(prev => {
      const next = new Set(prev)
      if (next.has(a.clase_grupo_id)) next.delete(a.clase_grupo_id)
      else next.add(a.clase_grupo_id)
      return next
    })
  }

  // Agrupa actividades por categoría, ordenadas alfabéticamente.
  const grupos = useMemo(() => {
    const map = new Map<string, { nombre: string; items: ActividadDisponible[] }>()
    for (const a of actividades) {
      const cat = a.actividad?.categoria
      const key = cat?.id ?? SIN_CATEGORIA
      const nombre = cat?.nombre ?? 'Sin categoría'
      if (!map.has(key)) map.set(key, { nombre, items: [] })
      map.get(key)!.items.push(a)
    }
    for (const g of map.values()) {
      g.items.sort((x, y) =>
        (x.actividad?.nombre ?? '').localeCompare(y.actividad?.nombre ?? '', 'es', { sensitivity: 'base' })
      )
    }
    return Array.from(map.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
  }, [actividades])

  // Conteo de la selección por categoría
  const conteoPorCategoria = useMemo(() => {
    const m = new Map<string, number>()
    for (const a of actividades) {
      if (!seleccion.has(a.clase_grupo_id)) continue
      const key = a.actividad?.categoria?.id ?? SIN_CATEGORIA
      m.set(key, (m.get(key) ?? 0) + 1)
    }
    return m
  }, [actividades, seleccion])

  // Validación: cada categoría con mínimo debe cumplirse exactamente
  const validacion = useMemo(() => {
    const faltantes: string[] = []
    const exceso: string[] = []
    for (const m of minimos) {
      const actual = conteoPorCategoria.get(m.categoria_id) ?? 0
      if (actual < m.cantidad) faltantes.push(`${m.categoria_nombre}: ${actual}/${m.cantidad}`)
      else if (actual > m.cantidad) exceso.push(`${m.categoria_nombre}: ${actual}/${m.cantidad}`)
    }
    return { faltantes, exceso, ok: faltantes.length === 0 && exceso.length === 0 }
  }, [minimos, conteoPorCategoria])

  async function confirmarInscripcion() {
    if (!nino || !semanaSel) return
    if (!validacion.ok) return
    setGuardando(true); setError(''); setAviso(''); setLlenasIds(new Set())
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${BACKEND}/api/inscripciones/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          nino_id: nino.id,
          semana_id: semanaSel.id,
          clase_grupo_ids: Array.from(seleccion),
        }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok) {
        onCambio()
        onClose()
      } else if (res.status === 409 && Array.isArray(data?.llenas) && data.llenas.length > 0) {
        const llenas = new Set<string>(data.llenas)
        setLlenasIds(llenas)
        setSeleccion(prev => {
          const next = new Set(prev)
          for (const id of llenas) next.delete(id)
          return next
        })
        const nombresLlenas = actividades
          .filter(a => llenas.has(a.clase_grupo_id))
          .map(a => a.actividad?.nombre ?? '')
          .filter(Boolean)
          .join(', ')
        setAviso(
          nombresLlenas
            ? `Se llenó el cupo de: ${nombresLlenas}. No se inscribió nada. Reemplázala por otra de la misma categoría y vuelve a confirmar.`
            : 'Una o más actividades se llenaron. Elige otras y vuelve a confirmar.'
        )
        await cargarActividades(semanaSel.id)
      } else {
        setError(data?.error ?? 'Error al inscribir.')
      }
    } catch {
      setError('Error de conexión.')
    }
    setGuardando(false)
  }

  if (!open || !nino) return null

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-grande" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <h2>Inscripciones</h2>
            <p className="text-muted">
              {nino.nombre} {nino.apellido}
              {nino.grupo && <> · grupo <strong>{nino.grupo.nombre}</strong></>}
              {semanaSel && (
                <> · semana <strong>{semanaSel.nombre || `${semanaSel.fecha_inicio} → ${semanaSel.fecha_fin}`}</strong></>
              )}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {!semanaSel ? (
          cargandoSemanas ? (
            <p className="text-muted">Cargando semanas...</p>
          ) : semanas.length === 0 ? (
            <p className="text-muted">No hay semanas activas en este momento.</p>
          ) : (
            <div className="semanas-lista">
              {semanas.map(s => (
                <button
                  key={s.id}
                  type="button"
                  className="semana-card"
                  onClick={() => elegirSemana(s)}
                >
                  <div className="semana-card-titulo">{s.nombre || 'Sin nombre'}</div>
                  <div className="semana-card-fechas text-muted">
                    {s.fecha_inicio} → {s.fecha_fin}
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          <>
            <div className="paso-acciones">
              <button type="button" className="btn btn-secondary btn-sm" onClick={volverASemanas} disabled={guardando}>
                ← Volver a semanas
              </button>
            </div>

            {cargandoActs ? (
              <p className="text-muted">Cargando actividades...</p>
            ) : actividades.length === 0 ? (
              <p className="text-muted">No hay actividades disponibles para el grupo de este niño en esta semana.</p>
            ) : (
              <>
                {aviso && <div className="aviso-msg">{aviso}</div>}

                {grupos.map(g => {
                  const minimo = minimos.find(m => m.categoria_id === g.key)
                  const sel = conteoPorCategoria.get(g.key) ?? 0
                  const requerido = minimo?.cantidad ?? 0
                  const cumplida = requerido > 0 ? sel === requerido : true
                  return (
                    <section key={g.key} className="categoria-bloque">
                      <header className="categoria-header">
                        <h3 className="categoria-titulo">{g.nombre}</h3>
                        {requerido > 0 && (
                          <span className={`categoria-contador ${cumplida ? 'ok' : 'pendiente'}`}>
                            {sel} / {requerido}
                          </span>
                        )}
                      </header>
                      <div className="actividades-grid">
                        {g.items.map(a => {
                          const seleccionada = seleccion.has(a.clase_grupo_id)
                          const lleno = a.inscritos >= a.cupo && !seleccionada
                          const recienLlena = llenasIds.has(a.clase_grupo_id)
                          return (
                            <button
                              key={a.clase_grupo_id}
                              type="button"
                              className={`actividad-mini ${seleccionada ? 'sel' : ''} ${lleno || recienLlena ? 'llena' : ''}`}
                              onClick={() => toggleActividad(a)}
                              disabled={(lleno || recienLlena) && !seleccionada}
                              aria-pressed={seleccionada}
                            >
                              <span className="actividad-mini-nombre">{a.actividad?.nombre ?? '—'}</span>
                              <span className="actividad-mini-cupo">
                                {a.inscritos} / {a.cupo}
                                {recienLlena && <span className="actividad-mini-llena"> · sin cupo</span>}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </section>
                  )
                })}

                {minimos.length === 0 && (
                  <p className="text-muted">
                    El administrador aún no configuró los mínimos obligatorios para este club.
                  </p>
                )}

                <div className="inscripcion-resumen">
                  {validacion.faltantes.length > 0 && (
                    <p className="text-muted">
                      Faltan: {validacion.faltantes.join(' · ')}
                    </p>
                  )}
                  {validacion.exceso.length > 0 && (
                    <p className="text-muted">
                      Excede el máximo: {validacion.exceso.join(' · ')}
                    </p>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {error && <p className="error-msg">{error}</p>}

        <div className="form-acciones">
          <button className="btn btn-secondary" onClick={onClose} disabled={guardando}>Cerrar</button>
          {semanaSel && actividades.length > 0 && (
            <button
              className="btn btn-primary"
              onClick={confirmarInscripcion}
              disabled={guardando || !validacion.ok || minimos.length === 0}
            >
              {guardando ? 'Inscribiendo...' : 'Inscribirse'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
