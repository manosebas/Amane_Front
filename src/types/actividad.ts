export type Categoria = {
  id: string
  nombre: string
  descripcion: string | null
  created_at: string
}

export type Actividad = {
  id: string
  nombre: string
  descripcion: string | null
  categoria_id: string
  categoria?: { id: string; nombre: string } | null
  created_at: string
}
