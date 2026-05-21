import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'

type ResumenActividad = { id: string; nombre: string }
type ResumenCategoria = { id: string; nombre: string; actividades: ResumenActividad[] }
type ResumenSemana = {
  semana: {
    id: string
    nombre: string | null
    fecha_inicio: string
    fecha_fin: string
    estado: string
  }
  categorias: ResumenCategoria[]
}

type Props = {
  ninoId: string
  refreshKey?: number
}

export function NinoResumen({ ninoId, refreshKey = 0 }: Props) {
  const [semanas, setSemanas] = useState<ResumenSemana[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true); setError('')
    try {
      const res = await api(`/api/inscripciones/resumen/${ninoId}`)
      const data = await res.json().catch(() => null)
      if (!res.ok) setError(data?.error ?? 'Error al cargar resumen.')
      else setSemanas(data?.semanas ?? [])
    } catch {
      setError('Error de conexión.')
    }
    setCargando(false)
  }, [ninoId])

  useEffect(() => { cargar() }, [cargar, refreshKey])

  if (cargando) {
    return <div className="nino-resumen text-muted">Cargando inscripciones...</div>
  }
  if (error) {
    return <div className="nino-resumen error-msg">{error}</div>
  }
  if (semanas.length === 0) {
    return <div className="nino-resumen text-muted">Aún no tiene inscripciones.</div>
  }

  return (
    <div className="nino-resumen">
      <div className="nino-resumen-titulo">Inscripciones</div>
      {semanas.map(s => (
        <div key={s.semana.id} className="resumen-semana">
          <div className="resumen-semana-header">
            <span className="resumen-semana-nombre">
              {s.semana.nombre || 'Sin nombre'}
            </span>
            <span className="resumen-semana-fechas text-muted">
              {s.semana.fecha_inicio} → {s.semana.fecha_fin}
            </span>
          </div>
          {s.categorias.map(c => (
            <div key={c.id} className="resumen-categoria">
              <div className="resumen-categoria-nombre">{c.nombre}</div>
              <ul className="resumen-actividades">
                {c.actividades.map(a => (
                  <li key={a.id}>{a.nombre}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
