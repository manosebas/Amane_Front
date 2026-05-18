export type ClaseGrupo = {
  id: string
  grupo_id: string
  cupo: number
  inscritos?: number
  grupo?: { id: string; nombre: string; edad_min: number; edad_max: number } | null
}

export type Clase = {
  id: string
  semana_id: string
  actividad_id: string
  created_at: string
  actividad?: { id: string; nombre: string; categoria?: { id: string; nombre: string } } | null
  cupos: ClaseGrupo[]
}

export type ActividadDisponible = {
  clase_id: string
  clase_grupo_id: string
  actividad: {
    id: string
    nombre: string
    categoria?: { id: string; nombre: string } | null
  } | null
  cupo: number
  inscritos: number
  inscripcion_id: string | null
}

export type MinimoDisponible = {
  categoria_id: string
  categoria_nombre: string
  cantidad: number
}
