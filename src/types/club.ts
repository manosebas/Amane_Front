export type ClubCheckbox = {
  id?: string
  etiqueta: string
  requerido: boolean
  orden?: number
}

export type Club = {
  id: string
  nombre: string
  descripcion: string | null
  logo_url: string | null
  terminos_pdf_url: string | null
  mostrar_es_socio: boolean
  es_socio_requerido: boolean
  mostrar_terminos: boolean
  terminos_requerido: boolean
  activo: boolean
  created_at: string
  checkboxes?: ClubCheckbox[]
}
