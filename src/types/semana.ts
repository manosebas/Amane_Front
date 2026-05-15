export type EstadoSemana = 'borrador' | 'activa'

export type Semana = {
  id: string
  club_id: string
  nombre: string | null
  fecha_inicio: string
  fecha_fin: string
  estado: EstadoSemana
  created_at: string
  club?: { id: string; nombre: string } | null
}
