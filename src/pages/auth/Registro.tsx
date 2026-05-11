import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

type Club = {
  id: string
  nombre: string
  descripcion: string | null
}

type FormData = {
  nombre: string
  apellido: string
  email: string
  cedula: string
  telefono: string
  password: string
  es_socio: boolean
  acepto_terminos: boolean
}

const FORM_INICIAL: FormData = {
  nombre: '',
  apellido: '',
  email: '',
  cedula: '',
  telefono: '',
  password: '',
  es_socio: false,
  acepto_terminos: false,
}

export default function Registro() {
  const navigate = useNavigate()
  const [clubes, setClubes] = useState<Club[]>([])
  const [cargando, setCargando] = useState(true)
  const [clubSeleccionado, setClubSeleccionado] = useState<Club | null>(null)
  const [form, setForm] = useState<FormData>(FORM_INICIAL)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    supabase
      .from('clubes')
      .select('id, nombre, descripcion')
      .eq('activo', true)
      .order('nombre')
      .then(({ data }) => {
        setClubes(data ?? [])
        setCargando(false)
      })
  }, [])

  function abrirModal(club: Club) {
    setClubSeleccionado(club)
    setForm(FORM_INICIAL)
    setError('')
  }

  function cerrarModal() {
    if (enviando) return
    setClubSeleccionado(null)
    setError('')
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.acepto_terminos) {
      setError('Debes aceptar los términos y condiciones.')
      return
    }

    setError('')
    setEnviando(true)

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          apellido: form.apellido,
          email: form.email,
          cedula: form.cedula,
          telefono: form.telefono,
          password: form.password,
          es_socio: form.es_socio,
          club_id: clubSeleccionado!.id,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al registrarse. Intenta nuevamente.')
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        })
        if (loginError) {
          navigate('/login')
        } else {
          navigate('/dashboard')
        }
      }
    } catch {
      setError('Error de conexión. Verifica tu internet e intenta nuevamente.')
    }

    setEnviando(false)
  }

  return (
    <div className="registro-page">
      <nav className="nav">
        <Link to="/" className="nav-logo">Amané</Link>
        <Link to="/login" className="btn btn-secondary">Iniciar sesión</Link>
      </nav>

      <main className="registro-main">
        <h1 className="registro-titulo">Seleccione un club</h1>
        <p className="registro-subtitulo">Elija el club al que pertenece para continuar con el registro.</p>

        {cargando ? (
          <div className="loading">Cargando clubes...</div>
        ) : clubes.length === 0 ? (
          <p className="text-muted">No hay clubes disponibles en este momento.</p>
        ) : (
          <div className="clubes-grid">
            {clubes.map(club => (
              <button key={club.id} className="club-card" onClick={() => abrirModal(club)}>
                <span className="club-card-nombre">{club.nombre}</span>
                {club.descripcion && (
                  <span className="club-card-desc">{club.descripcion}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </main>

      {clubSeleccionado && (
        <div
          className="modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) cerrarModal() }}
        >
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <h2>Información de contacto</h2>
                <p className="modal-club">Club: <strong>{clubSeleccionado.nombre}</strong></p>
              </div>
              <button className="modal-close" onClick={cerrarModal} aria-label="Cerrar" disabled={enviando}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nombre">Nombre del representante</label>
                  <input
                    id="nombre" name="nombre" type="text"
                    value={form.nombre} onChange={handleChange}
                    required autoComplete="given-name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="apellido">Apellido del representante</label>
                  <input
                    id="apellido" name="apellido" type="text"
                    value={form.apellido} onChange={handleChange}
                    required autoComplete="family-name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Correo electrónico</label>
                <input
                  id="email" name="email" type="email"
                  value={form.email} onChange={handleChange}
                  required autoComplete="email"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cedula">Cédula del representante</label>
                  <input
                    id="cedula" name="cedula" type="text"
                    value={form.cedula} onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="telefono">Teléfono del representante</label>
                  <input
                    id="telefono" name="telefono" type="tel"
                    value={form.telefono} onChange={handleChange}
                    required autoComplete="tel"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Contraseña</label>
                <input
                  id="password" name="password" type="password"
                  value={form.password} onChange={handleChange}
                  required minLength={6} autoComplete="new-password"
                />
              </div>

              <div className="checkboxes">
                <label className="checkbox-label">
                  <input
                    type="checkbox" name="es_socio"
                    checked={form.es_socio} onChange={handleChange}
                  />
                  <span>Soy socio del club</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox" name="acepto_terminos"
                    checked={form.acepto_terminos} onChange={handleChange}
                    required
                  />
                  <span>Acepto los <a href="/terminos" target="_blank" rel="noopener noreferrer">términos y condiciones</a></span>
                </label>
              </div>

              {error && <p className="error-msg">{error}</p>}

              <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
                {enviando ? 'Registrando...' : 'Registrarse'}
              </button>

              <p className="auth-footer">
                ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
