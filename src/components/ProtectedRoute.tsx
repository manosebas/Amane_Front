import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="loading">Cargando...</div>
  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
