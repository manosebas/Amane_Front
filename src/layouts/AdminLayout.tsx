import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'admin-nav-link active' : 'admin-nav-link'
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">Amané Admin</div>

        <nav className="admin-nav">
          <NavLink to="/admin" end className={navClass}>Inicio</NavLink>
          <NavLink to="/admin/clubes" className={navClass}>Clubes</NavLink>
          <NavLink to="/admin/actividades" className={navClass}>Actividades</NavLink>
          <NavLink to="/admin/grupos" className={navClass}>Grupos</NavLink>
          <NavLink to="/admin/personal" className={navClass}>Personal</NavLink>
          <NavLink to="/admin/club-actividad" className={navClass}>Club-Actividad</NavLink>
          <NavLink to="/admin/gestion" className={navClass}>Gestión</NavLink>
        </nav>

        <div className="admin-footer">
          <span className="admin-footer-email">{user?.email}</span>
          <button className="btn btn-secondary btn-block" onClick={handleSignOut}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
