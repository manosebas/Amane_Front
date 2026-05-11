import { colorDesdeNombre, inicialesDesdeNombre } from '../../lib/iconos'

type Props = {
  nombre: string
  size?: 'sm' | 'md' | 'lg'
}

export function IconoAuto({ nombre, size = 'md' }: Props) {
  return (
    <div
      className={`icono-auto icono-auto-${size}`}
      style={{ background: colorDesdeNombre(nombre) }}
      aria-hidden="true"
    >
      {inicialesDesdeNombre(nombre)}
    </div>
  )
}
