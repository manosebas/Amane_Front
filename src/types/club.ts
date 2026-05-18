export type ClubCheckbox = {
  id?: string
  etiqueta: string
  requerido: boolean
  orden?: number
  pdf_url?: string | null
  pdf_file?: File | null
}

export type ClubMinimoCategoria = {
  categoria_id: string
  cantidad: number
}

export type Club = {
  id: string
  nombre: string
  descripcion: string | null
  logo_url: string | null
  activo: boolean
  created_at: string
  checkboxes?: ClubCheckbox[]
  grupo_ids?: string[]
  minimos_categoria?: ClubMinimoCategoria[]
}
