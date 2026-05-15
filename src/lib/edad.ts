export function calcularEdad(fechaNacimiento: string): number | null {
  const fn = new Date(fechaNacimiento)
  if (Number.isNaN(fn.getTime())) return null
  const hoy = new Date()
  let edad = hoy.getFullYear() - fn.getFullYear()
  const m = hoy.getMonth() - fn.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < fn.getDate())) edad--
  return edad
}
