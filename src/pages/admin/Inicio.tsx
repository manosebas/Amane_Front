import { useEffect, useState, useCallback } from 'react'
import { api } from '../../lib/api'
import type { Club } from '../../types/club'
import type { Semana } from '../../types/semana'

type Resumen = {
  inscritos: number
  cupos: number
  disponibles: number
  actividad_favorita: { nombre: string; inscritos: number } | null
  ninos_registrados: number
}

type GrupoOcup = {
  clase_grupo_id: string
  grupo: { id: string; nombre: string } | null
  cupo: number
  inscritos: number
  disponibles: number
}

type ActividadOcup = {
  clase_id: string
  actividad: {
    id: string
    nombre: string
    categoria: { id: string; nombre: string } | null
  } | null
  grupos: GrupoOcup[]
  total: { cupo: number; inscritos: number; disponibles: number }
}

export default function Inicio() {
  const [clubes, setClubes] = useState<Club[]>([])
  const [clubId, setClubId] = useState<string>('')
  const [semanas, setSemanas] = useState<Semana[]>([])
  const [semanaId, setSemanaId] = useState<string>('')

  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [ocupacion, setOcupacion] = useState<ActividadOcup[]>([])
  const [cargandoOcup, setCargandoOcup] = useState(false)
  const [error, setError] = useState('')

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

  const cargarOcupacion = useCallback(async (sid: string) => {
    if (!sid) { setOcupacion([]); setResumen(null); return }
    setCargandoOcup(true); setError('')
    try {
      const res = await api(`/api/admin/dashboard/ocupacion?semana_id=${sid}`)
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error ?? 'Error al cargar ocupación.')
        setOcupacion([]); setResumen(null)
      } else {
        setOcupacion(data?.actividades ?? [])
        setResumen(data?.resumen ?? null)
      }
    } catch {
      setError('Error de conexión.')
    }
    setCargandoOcup(false)
  }, [])

  useEffect(() => { cargarOcupacion(semanaId) }, [semanaId, cargarOcupacion])

  // Agrupar actividades por categoría
  const SIN_CAT = '__sin__'
  const porCategoria = ocupacion.reduce<Record<string, { nombre: string; items: ActividadOcup[] }>>((acc, a) => {
    const id = a.actividad?.categoria?.id ?? SIN_CAT
    const nombre = a.actividad?.categoria?.nombre ?? 'Sin categoría'
    if (!acc[id]) acc[id] = { nombre, items: [] }
    acc[id].items.push(a)
    return acc
  }, {})
  const categorias = Object.values(porCategoria).sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
  )

  return (
    <div>
      <h1 className="admin-page-titulo">Inicio</h1>

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
      </div>

      {error && <div className="error-msg">{error}</div>}

      {!semanaId ? (
        <p className="text-muted">Elige un club y una semana para ver el resumen.</p>
      ) : cargandoOcup ? (
        <p className="text-muted">Cargando resumen...</p>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi-card">
              <span className="kpi-label">Inscritos / Cupos</span>
              <span className="kpi-value">
                {resumen?.inscritos ?? 0}<span className="kpi-sub"> / {resumen?.cupos ?? 0}</span>
              </span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Cupos disponibles</span>
              <span className="kpi-value">{resumen?.disponibles ?? 0}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Actividad favorita</span>
              {resumen?.actividad_favorita ? (
                <>
                  <span className="kpi-value kpi-value-text">{resumen.actividad_favorita.nombre}</span>
                  <span className="kpi-sub">{resumen.actividad_favorita.inscritos} inscritos</span>
                </>
              ) : (
                <span className="kpi-value kpi-value-text text-muted">—</span>
              )}
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Niños registrados</span>
              <span className="kpi-value">{resumen?.ninos_registrados ?? 0}</span>
            </div>
          </div>

          {ocupacion.length === 0 ? (
            <div className="admin-empty"><p>No hay clases creadas en esta semana.</p></div>
          ) : (
            <section className="ocupacion-section">
              <h2 className="admin-section-titulo">Ocupación por actividad</h2>
              {categorias.map(cat => (
              <div key={cat.nombre} className="ocupacion-categoria">
                <h3 className="ocupacion-categoria-titulo">{cat.nombre}</h3>
                <table className="admin-tabla ocupacion-tabla">
                  <thead>
                    <tr>
                      <th>Actividad</th>
                      <th>Grupo</th>
                      <th className="num">Cupo</th>
                      <th className="num">Inscritos</th>
                      <th className="num">Disponibles</th>
                      <th>Ocupación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.items.flatMap(a => {
                      const rows = a.grupos.length === 0
                        ? [(
                          <tr key={`${a.clase_id}-empty`}>
                            <td>{a.actividad?.nombre ?? '—'}</td>
                            <td className="text-muted" colSpan={5}>Sin grupos asignados</td>
                          </tr>
                        )]
                        : a.grupos.map((g, idx) => {
                          const pct = g.cupo > 0 ? Math.round((g.inscritos / g.cupo) * 100) : 0
                          return (
                            <tr key={g.clase_grupo_id}>
                              {idx === 0 ? (
                                <td rowSpan={a.grupos.length} className="ocup-actividad-cell">
                                  {a.actividad?.nombre ?? '—'}
                                </td>
                              ) : null}
                              <td>{g.grupo?.nombre ?? '—'}</td>
                              <td className="num">{g.cupo}</td>
                              <td className="num">{g.inscritos}</td>
                              <td className={`num ${g.disponibles === 0 ? 'ocup-llena' : ''}`}>{g.disponibles}</td>
                              <td className="ocup-bar-cell">
                                <div className="ocup-bar"><div className="ocup-bar-fill" style={{ width: `${Math.min(100, pct)}%` }} /></div>
                                <span className="ocup-bar-text">{pct}%</span>
                              </td>
                            </tr>
                          )
                        })
                      return rows
                    })}
                  </tbody>
                </table>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}
