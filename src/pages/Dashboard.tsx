import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="dashboard">
      <nav className="nav">
        <span className="nav-logo">Amané</span>
        <div className="nav-actions">
          <span className="nav-email">{user?.email}</span>
          <button className="btn btn-secondary" onClick={handleSignOut}>
            Cerrar sesión
          </button>
        </div>
      </nav>
      <main className="dashboard-content">
        <h1>Dashboard</h1>
        <p>Bienvenido, {user?.email}</p>
      </main>
    </div>
  )
}
