export type Nino = {
  id: string
  padre_id: string
  nombre: string
  apellido: string
  fecha_nacimiento: string
  grupo_id: string | null
  created_at: string
  grupo?: { id: string; nombre: string; edad_min: number; edad_max: number } | null
}
