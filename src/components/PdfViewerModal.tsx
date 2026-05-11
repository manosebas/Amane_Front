import { useEffect } from 'react'

type Props = {
  url: string
  titulo?: string
  open: boolean
  onClose: () => void
}

export function PdfViewerModal({ url, titulo = 'Documento', open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="pdf-modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="pdf-modal" role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="pdf-modal-header">
          <h3 className="pdf-modal-titulo">{titulo}</h3>
          <div className="pdf-modal-actions">
            <a
              href={url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
            >
              Descargar
            </a>
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        </div>
        <iframe src={url} className="pdf-modal-iframe" title={titulo} />
      </div>
    </div>
  )
}
