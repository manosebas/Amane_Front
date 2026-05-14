import type { Club } from '../../types/club'

type Props = {
  club: Club
  onEditar: (club: Club) => void
}

export function ClubCard({ club, onEditar }: Props) {
  return (
    <article className="club-admin-card">
      <button
        type="button"
        className="card-edit-btn"
        onClick={() => onEditar(club)}
        aria-label={`Editar ${club.nombre}`}
        title="Editar"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>

      <div className="club-admin-card-imagen">
        {club.logo_url ? (
          <img src={club.logo_url} alt={club.nombre} />
        ) : (
          <div className="club-admin-card-placeholder">
            <span>Sin logo</span>
          </div>
        )}
        <span className={`club-admin-card-badge ${club.activo ? 'badge-activo' : 'badge-inactivo'}`}>
          {club.activo ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      <div className="club-admin-card-body">
        <h3 className="club-admin-card-nombre">{club.nombre}</h3>
        {club.descripcion && (
          <p className="club-admin-card-desc">{club.descripcion}</p>
        )}

        <div className="club-admin-card-meta">
          {club.terminos_pdf_url && <span>📄 PDF</span>}
          {club.checkboxes && club.checkboxes.length > 0 && (
            <span>☑ {club.checkboxes.length} extra</span>
          )}
        </div>
      </div>
    </article>
  )
}
