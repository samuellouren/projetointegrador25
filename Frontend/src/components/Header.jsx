import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Header.css'

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => {
    return location.pathname === path ? 'active' : ''
  }

  return (
    <header className="app-header">
      <div className="header-content">
        <h1 onClick={() => navigate('/candidates')} style={{ cursor: 'pointer' }}>
          Talent<span>Match</span>
        </h1>
        
        <nav className="header-nav">
          <button 
            onClick={() => navigate('/candidates')}
            className={`nav-link ${isActive('/candidates')}`}
          >
            Candidatos
          </button>
          <button 
            onClick={() => navigate('/jobs')}
            className={`nav-link ${isActive('/jobs')}`}
          >
            Vagas
          </button>
          <button 
            onClick={() => navigate('/settings')}
            className={`nav-link ${isActive('/settings')}`}
          >
            Configurações
          </button>
        </nav>

        <div className="header-actions">
          <span className="user-name">Olá, {user?.name}</span>
          <button onClick={handleLogout} className="logout-button">
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}
