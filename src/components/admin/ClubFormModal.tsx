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
  onEliminar?: (club: Club) => void
}

type FormState = {
  nombre: string
  descripcion: string
  activo: boolean
  checkboxes: ClubCheckbox[]
}

const FORM_VACIO: FormState = {
  nombre: '',
  descripcion: '',
  activo: true,
  checkboxes: [],
}

export function ClubFormModal({ club, open, onClose, onGuardado, onEliminar }: Props) {
  const [form, setForm] = useState<FormState>(FORM_VACIO)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
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
        checkboxes: (club.checkboxes ?? []).map(cb => ({ ...cb, pdf_file: null })),
      })
      setLogoPreview(club.logo_url)
    } else {
      setForm(FORM_VACIO)
      setLogoPreview(null)
    }
    setLogoFile(null)
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

  function actualizarCheckbox(i: number, cambios: Partial<ClubCheckbox>) {
    setForm(prev => ({
      ...prev,
      checkboxes: prev.checkboxes.map((cb, idx) => idx === i ? { ...cb, ...cambios } : cb),
    }))
  }

  function agregarCheckbox() {
    setForm(prev => ({
      ...prev,
      checkboxes: [...prev.checkboxes, { etiqueta: '', requerido: false, pdf_url: null, pdf_file: null }],
    }))
  }

  function eliminarCheckbox(i: number) {
    setForm(prev => ({
      ...prev,
      checkboxes: prev.checkboxes.filter((_, idx) => idx !== i),
    }))
  }

  function handlePdfCheckboxChange(i: number, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('El archivo adjunto debe ser un PDF.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('El PDF no puede superar 10MB.')
      return
    }
    setError('')
    actualizarCheckbox(i, { pdf_file: file, pdf_url: URL.createObjectURL(file) })
  }

  function quitarPdfCheckbox(i: number) {
    actualizarCheckbox(i, { pdf_file: null, pdf_url: null })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.nombre.trim()) {
      setError('El nombre del club es requerido.')
      return
    }

    if (form.checkboxes.some(cb => !cb.etiqueta.trim())) {
      setError('Todos los checkboxes deben tener etiqueta.')
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

      // Para el JSON enviado al backend, no incluimos pdf_file (es un File, no serializable)
      // y mandamos pdf_url solo si es una URL existente (http), no blob: previews.
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        activo: form.activo,
        checkboxes: form.checkboxes.map(cb => ({
          etiqueta: cb.etiqueta,
          requerido: cb.requerido,
          pdf_url: cb.pdf_url && !cb.pdf_url.startsWith('blob:') ? cb.pdf_url : null,
        })),
      }

      const fd = new FormData()
      fd.append('data', JSON.stringify(payload))
      if (logoFile) fd.append('logo', logoFile)
      form.checkboxes.forEach((cb, i) => {
        if (cb.pdf_file) fd.append(`checkbox_pdf_${i}`, cb.pdf_file)
      })

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
              <div className="form-seccion-header">
                <h3 className="form-seccion-titulo">Checkboxes del registro</h3>
                <button type="button" className="btn btn-secondary btn-sm" onClick={agregarCheckbox}>
                  + Agregar
                </button>
              </div>

              {form.checkboxes.length === 0 ? (
                <p className="text-muted form-vacio">Sin checkboxes. Agrega los que necesites para el registro de este club.</p>
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
                      {cb.pdf_url ? (
                        <>
                          <button
                            type="button"
                            className="link-button"
                            onClick={() => setPdfPreviewUrl(cb.pdf_url!)}
                          >
                            Ver PDF
                          </button>
                          <button
                            type="button"
                            className="link-button link-button-danger"
                            onClick={() => quitarPdfCheckbox(i)}
                          >
                            Quitar PDF
                          </button>
                        </>
                      ) : (
                        <label className="link-button">
                          + Adjuntar PDF
                          <input
                            type="file"
                            accept="application/pdf"
                            hidden
                            onChange={e => handlePdfCheckboxChange(i, e)}
                          />
                        </label>
                      )}
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
              {editando && onEliminar && club && (
                <button
                  type="button"
                  className="btn-eliminar-form"
                  onClick={() => onEliminar(club)}
                  disabled={guardando}
                >
                  Eliminar club
                </button>
              )}
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

      {pdfPreviewUrl && (
        <PdfViewerModal
          url={pdfPreviewUrl}
          titulo="PDF del checkbox"
          open={!!pdfPreviewUrl}
          onClose={() => setPdfPreviewUrl(null)}
        />
      )}
    </>
  )
}
