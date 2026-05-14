import { iconoDesdeNombre } from '../../lib/iconos'

type Props = {
  nombre: string
  size?: 'sm' | 'md' | 'lg'
}

export function IconoAuto({ nombre, size = 'md' }: Props) {
  return (
    <span
      className={`icono-auto icono-auto-${size}`}
      role="img"
      aria-label={nombre}
    >
      {iconoDesdeNombre(nombre)}
    </span>
  )
}
