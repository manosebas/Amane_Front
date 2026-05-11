import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { PdfViewerModal } from '../PdfViewerModal'
import type { Club, ClubCheckbox } from '../../types/club'

const BACKEND = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '')

type Props = {
  club: Club | null
  open: boolean
  onClose: () => void
  onGuardado: () => void
}

type FormState = {
  nombre: string
  descripcion: string
  activo: boolean
  mostrar_es_socio: boolean
  es_socio_requerido: boolean
  mostrar_terminos: boolean
  terminos_requerido: boolean
  checkboxes: ClubCheckbox[]
}

const FORM_VACIO: FormState = {
  nombre: '',
  descripcion: '',
  activo: true,
  mostrar_es_socio: true,
  es_socio_requerido: false,
  mostrar_terminos: true,
  terminos_requerido: true,
  checkboxes: [],
}

export function ClubFormModal({ club, open, onClose, onGuardado }: Props) {
  const [form, setForm] = useState<FormState>(FORM_VACIO)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfPreview, setPdfPreview] = useState<string | null>(null)
  const [mostrarPdf, setMostrarPdf] = useState(false)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const editando = !!club

  useEffect(() => {
    if (!open) return
    if (club) {
      setForm({
        nombre: club.nombre,
        descripcion: club.descripcion ?? '',
        activo: club.activo,
        mostrar_es_socio: club.mostrar_es_socio,
        es_socio_requerido: club.es_socio_requerido,
        mostrar_terminos: club.mostrar_terminos,
        terminos_requerido: club.terminos_requerido,
        checkboxes: club.checkboxes ?? [],
      })
      setLogoPreview(club.logo_url)
      setPdfPreview(club.terminos_pdf_url)
    } else {
      setForm(FORM_VACIO)
      setLogoPreview(null)
      setPdfPreview(null)
    }
    setLogoFile(null)
    setPdfFile(null)
    setError('')
  }, [open, club])

  function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('El logo debe ser una imagen.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('El logo no puede superar 5MB.')
      return
    }
    setError('')
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function handlePdfChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Los términos deben ser un PDF.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('El PDF no puede superar 10MB.')
      return
    }
    setError('')
    setPdfFile(file)
    setPdfPreview(URL.createObjectURL(file))
  }

  function actualizarCheckbox(i: number, cambios: Partial<ClubCheckbox>) {
    setForm(prev => ({
      ...prev,
      checkboxes: prev.checkboxes.map((cb, idx) => idx === i ? { ...cb, ...cambios } : cb),
    }))
  }

  function agregarCheckbox() {
    setForm(prev => ({
      ...prev,
      checkboxes: [...prev.checkboxes, { etiqueta: '', requerido: false }],
    }))
  }

  function eliminarCheckbox(i: number) {
    setForm(prev => ({
      ...prev,
      checkboxes: prev.checkboxes.filter((_, idx) => idx !== i),
    }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.nombre.trim()) {
      setError('El nombre del club es requerido.')
      return
    }

    if (form.checkboxes.some(cb => !cb.etiqueta.trim())) {
      setError('Todos los checkboxes personalizados deben tener etiqueta.')
      return
    }

    setGuardando(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Sesión expirada. Recarga la página.')
        setGuardando(false)
        return
      }

      const fd = new FormData()
      fd.append('data', JSON.stringify(form))
      if (logoFile) fd.append('logo', logoFile)
      if (pdfFile) fd.append('terminos_pdf', pdfFile)

      const url = editando
        ? `${BACKEND}/api/admin/clubes/${club!.id}`
        : `${BACKEND}/api/admin/clubes`

      const res = await fetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: fd,
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error ?? `Error del servidor (${res.status}).`)
      } else {
        onGuardado()
      }
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    }

    setGuardando(false)
  }

  if (!open) return null

  return (
    <>
      <div
        className="modal-overlay"
        onClick={e => { if (e.target === e.currentTarget && !guardando) onClose() }}
      >
        <div className="modal modal-grande" role="dialog" aria-modal="true">
          <div className="modal-header">
            <h2>{editando ? 'Editar club' : 'Nuevo club'}</h2>
            <button
              className="modal-close"
              onClick={onClose}
              disabled={guardando}
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>

          <div className={`estado-control ${form.activo ? 'estado-on' : 'estado-off'}`}>
            <button
              type="button"
              className={`estado-switch ${form.activo ? 'on' : 'off'}`}
              onClick={() => setForm({ ...form, activo: !form.activo })}
              aria-pressed={form.activo}
              aria-label="Toggle estado del club"
            >
              <span className="estado-thumb" />
            </button>
            <div className="estado-info">
              <span className="estado-label">
                {form.activo ? 'Club activo' : 'Club inactivo'}
              </span>
              <span className="estado-desc">
                {form.activo
                  ? 'Visible en el registro de padres'
                  : 'Oculto del registro de padres'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="form-club">
            <section className="form-seccion">
              <h3 className="form-seccion-titulo">Información general</h3>

              <div className="form-group">
                <label htmlFor="nombre">Nombre del club</label>
                <input
                  id="nombre"
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  required
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label htmlFor="descripcion">Descripción</label>
                <textarea
                  id="descripcion"
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  rows={3}
                  maxLength={500}
                />
              </div>
            </section>

            <section className="form-seccion">
              <h3 className="form-seccion-titulo">Logo del club</h3>
              <div className="form-archivo">
                {logoPreview && (
                  <div className="form-archivo-preview">
                    <img src={logoPreview} alt="Logo preview" />
                  </div>
                )}
                <label className="btn btn-secondary btn-sm form-archivo-input">
                  {logoPreview ? 'Cambiar logo' : 'Subir logo'}
                  <input type="file" accept="image/*" onChange={handleLogoChange} hidden />
                </label>
              </div>
            </section>

            <section className="form-seccion">
              <h3 className="form-seccion-titulo">Configuración del registro</h3>

              <div className="config-grupo">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.mostrar_es_socio}
                    onChange={e => setForm({ ...form, mostrar_es_socio: e.target.checked })}
                  />
                  <span>Mostrar "Soy socio del club" (Sí/No)</span>
                </label>
                {form.mostrar_es_socio && (
                  <label className="checkbox-label config-sub">
                    <input
                      type="checkbox"
                      checked={form.es_socio_requerido}
                      onChange={e => setForm({ ...form, es_socio_requerido: e.target.checked })}
                    />
                    <span>Obligatorio responder</span>
                  </label>
                )}
              </div>

              <div className="config-grupo">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.mostrar_terminos}
                    onChange={e => setForm({ ...form, mostrar_terminos: e.target.checked })}
                  />
                  <span>Mostrar "Acepto términos y condiciones"</span>
                </label>
                {form.mostrar_terminos && (
                  <label className="checkbox-label config-sub">
                    <input
                      type="checkbox"
                      checked={form.terminos_requerido}
                      onChange={e => setForm({ ...form, terminos_requerido: e.target.checked })}
                    />
                    <span>Obligatorio aceptar</span>
                  </label>
                )}
              </div>
            </section>

            {form.mostrar_terminos && (
              <section className="form-seccion">
                <h3 className="form-seccion-titulo">PDF de términos y condiciones</h3>
                <div className="form-archivo">
                  {pdfPreview && (
                    <button
                      type="button"
                      className="form-archivo-pdf"
                      onClick={() => setMostrarPdf(true)}
                    >
                      Ver PDF actual
                    </button>
                  )}
                  <label className="btn btn-secondary btn-sm form-archivo-input">
                    {pdfPreview ? 'Cambiar PDF' : 'Subir PDF'}
                    <input type="file" accept="application/pdf" onChange={handlePdfChange} hidden />
                  </label>
                </div>
              </section>
            )}

            <section className="form-seccion">
              <div className="form-seccion-header">
                <h3 className="form-seccion-titulo">Checkboxes personalizados</h3>
                <button type="button" className="btn btn-secondary btn-sm" onClick={agregarCheckbox}>
                  + Agregar
                </button>
              </div>

              {form.checkboxes.length === 0 ? (
                <p className="text-muted form-vacio">Sin checkboxes adicionales.</p>
              ) : (
                <div className="checkboxes-editor">
                  {form.checkboxes.map((cb, i) => (
                    <div key={i} className="checkbox-editor-fila">
                      <input
                        type="text"
                        placeholder="Etiqueta del checkbox"
                        value={cb.etiqueta}
                        onChange={e => actualizarCheckbox(i, { etiqueta: e.target.value })}
                        className="checkbox-editor-input"
                      />
                      <label className="checkbox-editor-req">
                        <input
                          type="checkbox"
                          checked={cb.requerido}
                          onChange={e => actualizarCheckbox(i, { requerido: e.target.checked })}
                        />
                        <span>Obligatorio</span>
                      </label>
                      <button
                        type="button"
                        className="checkbox-editor-eliminar"
                        onClick={() => eliminarCheckbox(i)}
                        aria-label="Eliminar checkbox"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {error && <p className="error-msg">{error}</p>}

            <div className="form-acciones">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {pdfPreview && (
        <PdfViewerModal
          url={pdfPreview}
          titulo="Términos y condiciones"
          open={mostrarPdf}
          onClose={() => setMostrarPdf(false)}
        />
      )}
    </>
  )
}
