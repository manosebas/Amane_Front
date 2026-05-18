import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

type IconProps = { className?: string }

function IconHome({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
    </svg>
  )
}

function IconMountain({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 20l6-10 4 6 3-4 5 8z" />
      <circle cx="9" cy="6" r="1.5" />
    </svg>
  )
}

function IconBuilding({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <line x1="9" y1="7" x2="9" y2="7" />
      <line x1="15" y1="7" x2="15" y2="7" />
      <line x1="9" y1="11" x2="9" y2="11" />
      <line x1="15" y1="11" x2="15" y2="11" />
      <line x1="9" y1="15" x2="9" y2="15" />
      <line x1="15" y1="15" x2="15" y2="15" />
      <path d="M10 21v-4h4v4" />
    </svg>
  )
}

function IconPalette({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3a9 9 0 1 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1-.24-.27-.39-.62-.39-1 0-.83.67-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.42-4.03-8-9-8z" />
      <circle cx="7.5" cy="10.5" r="1" fill="currentColor" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" />
      <circle cx="16.5" cy="10.5" r="1" fill="currentColor" />
    </svg>
  )
}

function IconIdCard({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M5 17c.7-1.5 2.2-2.5 4-2.5s3.3 1 4 2.5" />
      <line x1="15" y1="10" x2="19" y2="10" />
      <line x1="15" y1="13" x2="19" y2="13" />
    </svg>
  )
}

function IconLink({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 1 0-5.66-5.66l-1.5 1.5" />
      <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 1 0 5.66 5.66l1.5-1.5" />
    </svg>
  )
}

function IconCalendar({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
    </svg>
  )
}

function IconMenu({ className }: IconProps) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'admin-nav-link active' : 'admin-nav-link'
}

const ITEMS_TOP = [
  { to: '/admin', label: 'Inicio', icon: IconHome, end: true },
  { to: '/admin/grupos', label: 'Grupos', icon: IconMountain },
  { to: '/admin/clubes', label: 'Clubes', icon: IconBuilding },
  { to: '/admin/actividades', label: 'Actividades', icon: IconPalette },
]
const ITEMS_MID = [
  { to: '/admin/personal', label: 'Personal', icon: IconIdCard },
]
const ITEMS_BOT = [
  { to: '/admin/club-actividad', label: 'Club-Actividad', icon: IconLink },
  { to: '/admin/semanas', label: 'Semanas', icon: IconCalendar },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [colapsado, setColapsado] = useState(() => {
    return localStorage.getItem('admin-sidebar-colapsado') === '1'
  })
  const [cerrandoSesion, setCerrandoSesion] = useState(false)

  useEffect(() => {
    localStorage.setItem('admin-sidebar-colapsado', colapsado ? '1' : '0')
  }, [colapsado])

  async function handleSignOut() {
    setCerrandoSesion(true)
    await signOut()
    navigate('/')
  }

  function renderItem(it: typeof ITEMS_TOP[number]) {
    const Icon = it.icon
    return (
      <NavLink
        key={it.to}
        to={it.to}
        end={it.end}
        className={navClass}
        title={colapsado ? it.label : undefined}
      >
        <Icon className="admin-nav-icon" />
        <span className="admin-nav-label">{it.label}</span>
      </NavLink>
    )
  }

  return (
    <div className={`admin-layout ${colapsado ? 'sidebar-colapsado' : ''}`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <button
            type="button"
            className="admin-hamburguesa"
            onClick={() => setColapsado(c => !c)}
            aria-label={colapsado ? 'Expandir menú' : 'Colapsar menú'}
            title={colapsado ? 'Expandir menú' : 'Colapsar menú'}
          >
            <IconMenu />
          </button>
          {!colapsado && <div className="admin-logo">Amané Admin</div>}
        </div>

        <nav className="admin-nav">
          {ITEMS_TOP.map(renderItem)}
          <div className="admin-nav-separator" />
          {ITEMS_MID.map(renderItem)}
          <div className="admin-nav-separator" />
          {ITEMS_BOT.map(renderItem)}
        </nav>

        <div className="admin-footer">
          {!colapsado && <span className="admin-footer-email">{user?.email}</span>}
          <button
            className="btn btn-secondary btn-block admin-signout"
            onClick={handleSignOut}
            disabled={cerrandoSesion}
            title={colapsado ? (cerrandoSesion ? 'Cerrando sesión...' : 'Cerrar sesión') : undefined}
          >
            {colapsado ? (cerrandoSesion ? '…' : '⎋') : (cerrandoSesion ? 'Cerrando sesión...' : 'Cerrar sesión')}
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
