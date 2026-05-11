import { Navigate } from 'react-router-dom'
import { useAuth, type Rol } from '../hooks/useAuth'

type Props = {
  children: React.ReactNode
  rolRequerido?: Rol
}

export function ProtectedRoute({ children, rolRequerido }: Props) {
  const { user, rol, loading } = useAuth()

  if (loading) return <div className="loading">Cargando...</div>
  if (!user) return <Navigate to="/login" replace />
  if (rolRequerido && rol !== rolRequerido) return <Navigate to="/" replace />

  return <>{children}</>
}
