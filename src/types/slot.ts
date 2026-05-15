export type DiaSlot =
  | 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'

export const DIAS: DiaSlot[] = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo']

export const DIAS_LABEL: Record<DiaSlot, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
}

export type Slot = {
  id: string
  semana_id: string
  grupo_id: string
  actividad_id: string
  dia: DiaSlot
  hora_inicio: string
  hora_fin: string
  cupo: number
  personal_id: string | null
  grupo?: { id: string; nombre: string; edad_min: number; edad_max: number } | null
  actividad?: { id: string; nombre: string; categoria?: { id: string; nombre: string } } | null
  personal?: { id: string; nombre: string; apellido: string; rol: 'mate' | 'profesor' } | null
}

export type SlotPadre = {
  id: string
  dia: DiaSlot
  hora_inicio: string
  hora_fin: string
  cupo: number
  grupo_id: string
  actividad: { id: string; nombre: string } | null
  personal: { id: string; nombre: string; apellido: string } | null
  inscritos: number
  inscripcion_id: string | null
}
