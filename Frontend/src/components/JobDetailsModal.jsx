import { useEffect } from 'react'
import './Modal.css'

export default function JobDetailsModal({ job, onClose }) {
  // Fecha modal com tecla ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  if (!job) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{job.title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <label>Empresa:</label>
            <p>{job.company}</p>
          </div>

          <div className="detail-section">
            <label>Localização:</label>
            <p>{job.location}</p>
          </div>

          <div className="detail-section">
            <label>Tipo:</label>
            <p>{job.type}</p>
          </div>

          <div className="detail-section">
            <label>Salário:</label>
            <p className="salary-highlight">{job.salary}</p>
          </div>

          <div className="detail-section">
            <label>Descrição:</label>
            <p>{job.description}</p>
          </div>

          {job.requirements && (
            <div className="detail-section">
              <label>Requisitos:</label>
              <p>{job.requirements}</p>
            </div>
          )}

          {job.applications && job.applications.length > 0 && (
            <div className="detail-section">
              <label>Candidatos Aplicados ({job.applications.length}):</label>
              <div className="applications-list">
                {job.applications.map((app) => (
                  <div key={app.id} className="application-item">
                    <div className="application-avatar">
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="application-info">
                      <strong>{app.name}</strong>
                      <span>{app.email}</span>
                      {app.phone && <span>{app.phone}</span>}
                      <small>Aplicado em: {new Date(app.applied_at).toLocaleDateString('pt-BR')}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {job.applications && job.applications.length === 0 && (
            <div className="detail-section">
              <label>Candidatos:</label>
              <p className="no-applications">Nenhum candidato aplicado ainda</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-close" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  )
}
