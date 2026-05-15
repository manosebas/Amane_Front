export type RolPersonal = 'mate' | 'profesor'

export type Personal = {
  id: string
  club_id: string
  nombre: string
  apellido: string
  cedula: string
  rol: RolPersonal
  created_at: string
  club?: { id: string; nombre: string } | null
}
