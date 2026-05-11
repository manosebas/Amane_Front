import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Landing() {
  const navigate = useNavigate()
  const { user, rol } = useAuth()

  return (
    <div className="landing">
      <nav className="nav">
        <span className="nav-logo">Amané</span>
        <div className="nav-actions">
          {user ? (
            <button className="btn btn-primary" onClick={() => navigate(rol === 'admin' ? '/admin' : '/dashboard')}>
              Mi cuenta
            </button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => navigate('/login')}>
                Iniciar sesión
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/auth/registro')}>
                Registrarse
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="hero">
        <h1 className="hero-title">Bienvenido a Amané</h1>
        <p className="hero-subtitle">Tu plataforma para gestionar todo lo que necesitas.</p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/auth/registro')}>
            Registrarse
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate('/login')}>
            Iniciar sesión
          </button>
        </div>
      </main>
    </div>
  )
}
