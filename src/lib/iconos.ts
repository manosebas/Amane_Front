const COLORES = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#6366f1', '#a855f7', '#f43f5e', '#14b8a6',
]

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function colorDesdeNombre(nombre: string): string {
  return COLORES[hash(nombre) % COLORES.length]
}

export function inicialesDesdeNombre(nombre: string): string {
  const limpio = nombre.trim()
  if (!limpio) return '?'
  const palabras = limpio.split(/\s+/)
  if (palabras.length === 1) return palabras[0].charAt(0).toUpperCase()
  return (palabras[0].charAt(0) + palabras[1].charAt(0)).toUpperCase()
}
