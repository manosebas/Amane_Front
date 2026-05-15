import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { NinoFormModal } from '../components/NinoFormModal'
import { InscripcionesModal } from '../components/InscripcionesModal'
import { calcularEdad } from '../lib/edad'
import type { Nino } from '../types/nino'

const BACKEND = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '')

export default function Dashboard() {
  const { user, perfil, signOut } = useAuth()
  const navigate = useNavigate()

  const [ninos, setNinos] = useState<Nino[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [modalNinoAbierto, setModalNinoAbierto] = useState(false)
  const [editandoNino, setEditandoNino] = useState<Nino | null>(null)
  const [eliminandoNino, setEliminandoNino] = useState<Nino | null>(null)
  const [errorEliminar, setErrorEliminar] = useState('')

  const [inscripcionesNino, setInscripcionesNino] = useState<Nino | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true); setError('')
    try {
      const res = await api('/api/ninos')
      const data = await res.json().catch(() => null)
      if (!res.ok) setError(data?.error ?? 'Error al cargar niños.')
      else setNinos(data?.ninos ?? [])
    } catch {
      setError('Error de conexión.')
    }
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  async function eliminar(n: Nino) {
    setErrorEliminar('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${BACKEND}/api/ninos/${n.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { setErrorEliminar(data?.error ?? 'Error al eliminar.'); return }
      setEliminandoNino(null)
      cargar()
    } catch {
      setErrorEliminar('Error de conexión.')
    }
  }

  return (
    <div className="dashboard">
      <nav className="nav">
        <span className="nav-logo">Amané</span>
        <div className="nav-actions">
          <span className="nav-email">{user?.email}</span>
          <button className="btn btn-secondary" onClick={handleSignOut}>Cerrar sesión</button>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>Hola, {perfil?.nombre || user?.email}</h1>
            {perfil?.club && (
              <p className="text-muted">Club: <strong>{perfil.club.nombre}</strong></p>
            )}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => { setEditandoNino(null); setModalNinoAbierto(true) }}
          >
            + Registrar niño
          </button>
        </header>

        {error && <div className="error-msg">{error}</div>}

        {cargando ? (
          <p className="text-muted">Cargando...</p>
        ) : ninos.length === 0 ? (
          <div className="admin-empty">
            <p>Aún no has registrado niños. Empieza agregando uno.</p>
          </div>
        ) : (
          <div className="ninos-grid">
            {ninos.map(n => (
              <article key={n.id} className="nino-card">
                <button
                  type="button"
                  className="card-edit-btn"
                  onClick={() => { setEditandoNino(n); setModalNinoAbierto(true) }}
                  aria-label="Editar"
                  title="Editar"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <h3 className="nino-card-titulo">
                  {n.nombre} {n.apellido}
                  {(() => {
                    const edad = calcularEdad(n.fecha_nacimiento)
                    return edad !== null ? <span className="text-muted"> ({edad} años)</span> : null
                  })()}
                </h3>
                <p className="text-muted">
                  Fecha de nacimiento: {n.fecha_nacimiento}
                </p>
                {n.grupo ? (
                  <p>
                    Grupo: <strong>{n.grupo.nombre}</strong>{' '}
                    <span className="text-muted">({n.grupo.edad_min}–{n.grupo.edad_max} años)</span>
                  </p>
                ) : (
                  <p className="text-muted">Sin grupo asignado</p>
                )}
                <button className="btn btn-primary btn-block" onClick={() => setInscripcionesNino(n)}>
                  Ver inscripciones
                </button>
              </article>
            ))}
          </div>
        )}
      </main>

      <NinoFormModal
        nino={editandoNino}
        open={modalNinoAbierto}
        onClose={() => setModalNinoAbierto(false)}
        onGuardado={() => { setModalNinoAbierto(false); cargar() }}
        onEliminar={n => { setModalNinoAbierto(false); setEliminandoNino(n) }}
      />

      <InscripcionesModal
        nino={inscripcionesNino}
        open={!!inscripcionesNino}
        onClose={() => setInscripcionesNino(null)}
        onCambio={cargar}
      />

      {eliminandoNino && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setEliminandoNino(null); setErrorEliminar('') } }}>
          <div className="modal modal-confirm" role="dialog" aria-modal="true">
            <h2>¿Eliminar niño?</h2>
            <p className="text-muted">
              Vas a eliminar a <strong>{eliminandoNino.nombre} {eliminandoNino.apellido}</strong>. Esto cancela sus inscripciones.
            </p>
            {errorEliminar && <p className="error-msg">{errorEliminar}</p>}
            <div className="form-acciones">
              <button className="btn btn-secondary" onClick={() => { setEliminandoNino(null); setErrorEliminar('') }}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={() => eliminar(eliminandoNino)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
