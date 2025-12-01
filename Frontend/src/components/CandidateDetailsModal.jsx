import { useEffect } from 'react'
import './Modal.css'

export default function CandidateDetailsModal({ candidate, onClose }) {
  // Fecha modal com tecla ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  if (!candidate) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-with-avatar">
            <div className="modal-avatar">
              {candidate.name.charAt(0).toUpperCase()}
            </div>
            <h2>{candidate.name}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <label>Email:</label>
            <p>{candidate.email}</p>
          </div>

          {candidate.phone && (
            <div className="detail-section">
              <label>Telefone:</label>
              <p>{candidate.phone}</p>
            </div>
          )}

          {candidate.skills && (
            <div className="detail-section">
              <label>Habilidades:</label>
              <p>{candidate.skills}</p>
            </div>
          )}

          {candidate.experience && (
            <div className="detail-section">
              <label>Experiência:</label>
              <p>{candidate.experience}</p>
            </div>
          )}

          {candidate.education && (
            <div className="detail-section">
              <label>Educação:</label>
              <p>{candidate.education}</p>
            </div>
          )}

          {candidate.applications && candidate.applications.length > 0 && (
            <div className="detail-section">
              <label>Vagas Aplicadas ({candidate.applications.length}):</label>
              <div className="applications-list">
                {candidate.applications.map((app) => (
                  <div key={app.id} className="application-item">
                    <div className="application-info">
                      <strong>{app.title}</strong>
                      <span>{app.company} - {app.location}</span>
                      <span className="salary-highlight">{app.salary}</span>
                      <small>Aplicado em: {new Date(app.applied_at).toLocaleDateString('pt-BR')}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {candidate.applications && candidate.applications.length === 0 && (
            <div className="detail-section">
              <label>Vagas:</label>
              <p className="no-applications">Não aplicou para nenhuma vaga ainda</p>
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
