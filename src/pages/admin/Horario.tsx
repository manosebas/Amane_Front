import { useEffect, useState, useCallback, useMemo } from 'react'
import { api } from '../../lib/api'
import type { Club } from '../../types/club'
import type { Semana } from '../../types/semana'

type ActividadHorario = {
  clase_grupo_id: string
  actividad: {
    id: string
    nombre: string
    categoria: { id: string; nombre: string } | null
  } | null
  bloque: number | null
  inscritos: number
}
type Conflicto = { a: string; b: string; ninos: number }
type GrupoHorario = {
  grupo: { id: string; nombre: string; edad_min: number; edad_max: number } | null
  actividades: ActividadHorario[]
  conflictos: Conflicto[]
}

// Colorea cada actividad de un grupo (nodos) con un bloque (1..k) evitando que
// dos actividades que comparten niños caigan en el mismo bloque. Heurístico
// DSATUR; si no hay color libre, elige el bloque con menos niños cruzados.
function colorearGrupo(
  acts: ActividadHorario[],
  conflictos: Conflicto[],
  k: number
): Map<string, number> {
  const nodos = acts.map(a => a.clase_grupo_id)
  const adj = new Map<string, Map<string, number>>()
  for (const n of nodos) adj.set(n, new Map())
  for (const c of conflictos) {
    if (!adj.has(c.a) || !adj.has(c.b)) continue
    adj.get(c.a)!.set(c.b, c.ninos)
    adj.get(c.b)!.set(c.a, c.ninos)
  }

  const color = new Map<string, number>()
  const sat = new Map<string, Set<number>>()
  for (const n of nodos) sat.set(n, new Set())
  const grado = new Map<string, number>()
  for (const n of nodos) grado.set(n, adj.get(n)!.size)

  for (let it = 0; it < nodos.length; it++) {
    let best: string | null = null
    for (const n of nodos) {
      if (color.has(n)) continue
      if (best === null) { best = n; continue }
      const sN = sat.get(n)!.size, sB = sat.get(best)!.size
      if (sN > sB || (sN === sB && grado.get(n)! > grado.get(best)!)) best = n
    }
    if (best === null) break

    const usados = sat.get(best)!
    let elegido = 0
    for (let col = 1; col <= k; col++) {
      if (!usados.has(col)) { elegido = col; break }
    }
    if (elegido === 0) {
      // Sin color libre: bloque con menos niños cruzados.
      const carga = new Array(k + 1).fill(0)
      for (const [nb, ninos] of adj.get(best)!) {
        const cb = color.get(nb)
        if (cb) carga[cb] += ninos
      }
      let min = Infinity
      for (let col = 1; col <= k; col++) {
        if (carga[col] < min) { min = carga[col]; elegido = col }
      }
    }
    color.set(best, elegido)
    for (const nb of adj.get(best)!.keys()) {
      if (!color.has(nb)) sat.get(nb)!.add(elegido)
    }
  }
  return color
}

export default function Horario() {
  const [clubes, setClubes] = useState<Club[]>([])
  const [clubId, setClubId] = useState('')
  const [semanas, setSemanas] = useState<Semana[]>([])
  const [semanaId, setSemanaId] = useState('')

  const [grupos, setGrupos] = useState<GrupoHorario[]>([])
  const [numBloques, setNumBloques] = useState(5)
  const [asignacion, setAsignacion] = useState<Map<string, number | null>>(new Map())

  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const res = await api('/api/admin/clubes')
        const data = await res.json().catch(() => null)
        if (res.ok) {
          const cs: Club[] = data?.clubes ?? []
          setClubes(cs)
          if (cs.length > 0) setClubId(cs[0].id)
        }
      } catch { /* ignore */ }
    })()
  }, [])

  const cargarSemanas = useCallback(async (cid: string) => {
    setSemanas([]); setSemanaId('')
    if (!cid) return
    try {
      const res = await api(`/api/admin/semanas?club_id=${cid}`)
      const data = await res.json().catch(() => null)
      if (res.ok) {
        const ss: Semana[] = data?.semanas ?? []
        setSemanas(ss)
        const activa = ss.find(s => s.estado === 'activa') ?? ss[0]
        if (activa) setSemanaId(activa.id)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { if (clubId) cargarSemanas(clubId) }, [clubId, cargarSemanas])

  const cargarHorario = useCallback(async (sid: string) => {
    if (!sid) { setGrupos([]); setAsignacion(new Map()); return }
    setCargando(true); setError(''); setAviso(''); setDirty(false)
    try {
      const res = await api(`/api/admin/horario?semana_id=${sid}`)
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error ?? 'Error al cargar el horario.')
        setGrupos([]); setAsignacion(new Map())
      } else {
        const gs: GrupoHorario[] = data?.grupos ?? []
        setGrupos(gs)
        setNumBloques(data?.num_bloques ?? 5)
        const m = new Map<string, number | null>()
        for (const g of gs) for (const a of g.actividades) m.set(a.clase_grupo_id, a.bloque)
        setAsignacion(m)
      }
    } catch {
      setError('Error de conexión.')
    }
    setCargando(false)
  }, [])

  useEffect(() => { cargarHorario(semanaId) }, [semanaId, cargarHorario])

  function mover(cgId: string, bloque: number | null) {
    setAsignacion(prev => {
      const next = new Map(prev)
      next.set(cgId, bloque)
      return next
    })
    setDirty(true)
    setAviso('')
  }

  function generar() {
    const next = new Map<string, number | null>()
    for (const g of grupos) {
      const color = colorearGrupo(g.actividades, g.conflictos, numBloques)
      for (const a of g.actividades) next.set(a.clase_grupo_id, color.get(a.clase_grupo_id) ?? null)
    }
    setAsignacion(next)
    setDirty(true)
    setAviso('Horario generado. Revisa los cruces y guarda.')
  }

  async function guardar() {
    if (!semanaId) return
    setGuardando(true); setError('')
    try {
      const asignaciones = [...asignacion.entries()].map(([clase_grupo_id, bloque]) => ({ clase_grupo_id, bloque }))
      const res = await api('/api/admin/horario', {
        method: 'PUT',
        body: JSON.stringify({ semana_id: semanaId, num_bloques: numBloques, asignaciones }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) setError(data?.error ?? 'Error al guardar.')
      else { setDirty(false); setAviso('Horario guardado.') }
    } catch {
      setError('Error de conexión.')
    }
    setGuardando(false)
  }

  // Cruces en vivo: por grupo, clase_grupos en conflicto y niños cruzados.
  const cruces = useMemo(() => {
    const porGrupo = new Map<string, { ids: Set<string>; ninos: number }>()
    for (const g of grupos) {
      const gid = g.grupo?.id ?? '__sin__'
      const ids = new Set<string>()
      let ninos = 0
      for (const c of g.conflictos) {
        const ba = asignacion.get(c.a)
        const bb = asignacion.get(c.b)
        if (ba != null && ba === bb) {
          ids.add(c.a); ids.add(c.b); ninos += c.ninos
        }
      }
      porGrupo.set(gid, { ids, ninos })
    }
    return porGrupo
  }, [grupos, asignacion])

  const totalCruces = useMemo(
    () => [...cruces.values()].reduce((acc, c) => acc + c.ninos, 0),
    [cruces]
  )

  const bloques = Array.from({ length: numBloques }, (_, i) => i + 1)

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-titulo">Horario</h1>
        <div className="horario-acciones">
          <button className="btn btn-secondary btn-sm" onClick={generar} disabled={cargando || grupos.length === 0}>
            Generar horario
          </button>
          <button className="btn btn-primary btn-sm" onClick={guardar} disabled={!dirty || guardando || grupos.length === 0}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="inicio-filtros">
        <label>
          Club
          <select value={clubId} onChange={e => setClubId(e.target.value)} disabled={clubes.length === 0}>
            {clubes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </label>
        <label>
          Semana
          <select value={semanaId} onChange={e => setSemanaId(e.target.value)} disabled={semanas.length === 0}>
            {semanas.length === 0 && <option value="">Sin semanas</option>}
            {semanas.map(s => (
              <option key={s.id} value={s.id}>
                {(s.nombre || `${s.fecha_inicio} → ${s.fecha_fin}`)}{s.estado !== 'activa' ? ' · borrador' : ''}
              </option>
            ))}
          </select>
        </label>
        <label>
          Nº de bloques
          <input
            type="number"
            min={1}
            max={12}
            value={numBloques}
            onChange={e => { setNumBloques(Math.max(1, Number(e.target.value) || 1)); setDirty(true) }}
            className="bloques-input"
          />
        </label>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {aviso && <div className="aviso-msg">{aviso}</div>}

      {!semanaId ? (
        <p className="text-muted">Elige un club y una semana.</p>
      ) : cargando ? (
        <p className="text-muted">Cargando horario...</p>
      ) : grupos.length === 0 ? (
        <div className="admin-empty"><p>No hay actividades inscritas en esta semana.</p></div>
      ) : (
        <>
          <div className={`horario-resumen ${totalCruces > 0 ? 'con-cruces' : 'sin-cruces'}`}>
            {totalCruces > 0
              ? `⚠ ${totalCruces} cruce(s) de niños por resolver`
              : '✓ Sin cruces: cada niño tiene sus actividades en bloques distintos'}
          </div>

          {grupos.map(g => {
            const gid = g.grupo?.id ?? '__sin__'
            const cr = cruces.get(gid) ?? { ids: new Set<string>(), ninos: 0 }
            return (
              <section key={gid} className="horario-grupo">
                <header className="horario-grupo-header">
                  <h2 className="admin-section-titulo">
                    {g.grupo?.nombre ?? 'Sin grupo'}
                    {g.grupo && <span className="text-muted"> · {g.grupo.edad_min}–{g.grupo.edad_max} años</span>}
                  </h2>
                  <span className={`horario-grupo-estado ${cr.ninos > 0 ? 'mal' : 'ok'}`}>
                    {cr.ninos > 0 ? `⚠ ${cr.ninos} cruzados` : '✓ Sin cruces'}
                  </span>
                </header>

                <div className="horario-tablero">
                  {[0, ...bloques].map(b => {
                    const items = g.actividades.filter(a => (asignacion.get(a.clase_grupo_id) ?? 0) === b)
                    return (
                      <div key={b} className={`horario-col ${b === 0 ? 'sin-asignar' : ''}`}>
                        <div className="horario-col-titulo">{b === 0 ? 'Sin asignar' : `Bloque ${b}`}</div>
                        <div className="horario-col-body">
                          {items.length === 0 && <div className="horario-col-vacio">—</div>}
                          {items.map(a => {
                            const enConflicto = cr.ids.has(a.clase_grupo_id) && b !== 0
                            return (
                              <div key={a.clase_grupo_id} className={`horario-chip ${enConflicto ? 'conflicto' : ''}`}>
                                <div className="horario-chip-nombre">{a.actividad?.nombre ?? '—'}</div>
                                <div className="horario-chip-meta">
                                  {a.actividad?.categoria?.nombre && (
                                    <span className="horario-chip-cat">{a.actividad.categoria.nombre}</span>
                                  )}
                                  <span className="text-muted">{a.inscritos} niños</span>
                                </div>
                                <select
                                  className="horario-chip-select"
                                  value={asignacion.get(a.clase_grupo_id) ?? 0}
                                  onChange={e => {
                                    const v = Number(e.target.value)
                                    mover(a.clase_grupo_id, v === 0 ? null : v)
                                  }}
                                >
                                  <option value={0}>Sin asignar</option>
                                  {bloques.map(bl => <option key={bl} value={bl}>Bloque {bl}</option>)}
                                </select>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </>
      )}
    </div>
  )
}
