import type { Club } from '../../types/club'

type Props = {
  club: Club
  onEditar: (club: Club) => void
  onEliminar: (club: Club) => void
}

export function ClubCard({ club, onEditar, onEliminar }: Props) {
  return (
    <article className="club-admin-card">
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

      <div className="club-admin-card-actions">
        <button className="btn btn-secondary btn-sm" onClick={() => onEditar(club)}>
          Editar
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => onEliminar(club)}>
          Eliminar
        </button>
      </div>
    </article>
  )
}
