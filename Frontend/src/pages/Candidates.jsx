"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "./Candidates.css"
import Header from "../components/Header"
import CandidateDetailsModal from "../components/CandidateDetailsModal"
import EditCandidateModal from "../components/EditCandidateModal"

export default function Candidates() {
  const [candidates, setCandidates] = useState([])
  const [filteredCandidates, setFilteredCandidates] = useState([])
  const [jobs, setJobs] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [jobsFilter, setJobsFilter] = useState("todos")
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchCandidates()
    fetchJobs()
  }, [])

  useEffect(() => {
    let filtered = candidates.filter(
      (candidate) =>
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    // Filtro por status
    if (statusFilter !== "todos") {
      filtered = filtered.filter((candidate) => (candidate.status || "novo") === statusFilter)
    }

    if (jobsFilter !== "todos") {
      filtered = filtered.filter((candidate) => {
        return (
          candidate.applications && candidate.applications.some((app) => app.job_id === Number.parseInt(jobsFilter))
        )
      })
    }

    setFilteredCandidates(filtered)
  }, [searchTerm, statusFilter, jobsFilter, candidates])

  const fetchCandidates = async () => {
    try {
      const response = await axios.get("http://localhost:3333/api/candidates")
      console.log(" Candidatos carregados:", response.data)
      setCandidates(response.data)
      setFilteredCandidates(response.data)
    } catch (error) {
      console.error("Erro ao buscar candidatos:", error)
      alert("Erro ao buscar candidatos. Verifique se o servidor está rodando.")
    }
  }

  const fetchJobs = async () => {
    try {
      const response = await axios.get("http://localhost:3333/api/jobs")
      console.log(" Vagas carregadas:", response.data)
      setJobs(response.data)
    } catch (error) {
      console.error("Erro ao buscar vagas:", error)
    }
  }

  const handleAddCandidate = () => {
    navigate("/add-candidate")
  }

  const handleViewDetails = async (candidate) => {
    try {
      const response = await axios.get(`http://localhost:3333/api/candidates/${candidate.id}`)
      setSelectedCandidate(response.data)
      setShowDetailsModal(true)
    } catch (error) {
      console.error("[v0] Erro ao buscar detalhes:", error)
      alert("Erro ao buscar detalhes do candidato")
    }
  }

  const handleEdit = (candidate) => {
    setSelectedCandidate(candidate)
    setShowEditModal(true)
  }

  const handleDelete = async (candidate) => {
    if (!confirm(`Tem certeza que deseja deletar o candidato ${candidate.name}?`)) {
      return
    }

    try {
      await axios.delete(`http://localhost:3333/api/candidates/${candidate.id}`)
      alert("Candidato deletado com sucesso!")
      fetchCandidates()
    } catch (error) {
      console.error("[v0] Erro ao deletar candidato:", error)
      alert("Erro ao deletar candidato")
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      novo: "#6366f1",
      entrevista: "#f59e0b",
      contratado: "#10b981",
      recusado: "#ef4444",
    }
    return colors[status] || "#6366f1"
  }

  const getStatusLabel = (status) => {
    const labels = {
      novo: "Novo",
      entrevista: "Entrevista",
      contratado: "Contratado",
      recusado: "Recusado",
    }
    return labels[status] || "Novo"
  }

  const getCompatibilityColor = (compatibility) => {
    if (compatibility >= 75) return "#10b981" // Verde
    if (compatibility >= 50) return "#f59e0b" // Amarelo
    if (compatibility >= 25) return "#ef4444" // Vermelho
    return "#6b7280" // Cinza
  }

  return (
    <div className="candidates-container">
      <Header />

      <main className="candidates-main">
        <div className="search-section">
          <div className="section-header">
            <h2>Candidatos</h2>
            <button onClick={handleAddCandidate} className="btn-add">
              + Adicionar Candidato
            </button>
          </div>

          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

          <div className="filters-section">
            <div className="filter-group">
              <label>Filtrar por Status:</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
                <option value="todos">Todos os Status</option>
                <option value="novo">Novo</option>
                <option value="entrevista">Entrevista</option>
                <option value="contratado">Contratado</option>
                <option value="recusado">Recusado</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Filtrar por Vaga:</label>
              <select value={jobsFilter} onChange={(e) => setJobsFilter(e.target.value)} className="filter-select">
                <option value="todos">Todas as Vagas</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} - {job.company}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="candidates-grid">
          {filteredCandidates.map((candidate) => (
            <div key={candidate.id} className="candidate-card">
              <div className="status-badge" style={{ backgroundColor: getStatusColor(candidate.status || "novo") }}>
                {getStatusLabel(candidate.status || "novo")}
              </div>

              <div className="card-header">
                <div className="avatar">{candidate.name.charAt(0).toUpperCase()}</div>
              </div>
              <h3>{candidate.name}</h3>
              <p className="email">{candidate.email}</p>

              {candidate.applications_count > 0 && (
                <div className="compatibility-info">
                  <span
                    className="compatibility-badge"
                    style={{
                      backgroundColor: getCompatibilityColor(candidate.avg_compatibility || 0),
                      color: "white",
                    }}
                  >
                    {candidate.avg_compatibility || 0}% compatível
                  </span>
                </div>
              )}

              <p className="date">Cadastrado em: {new Date(candidate.created_at).toLocaleDateString("pt-BR")}</p>
              <div className="card-actions">
                <button className="btn-details" onClick={() => handleViewDetails(candidate)}>
                  Ver Detalhes
                </button>
                <button className="btn-edit" onClick={() => handleEdit(candidate)}>
                  Editar
                </button>
                <button className="btn-delete" onClick={() => handleDelete(candidate)}>
                  Deletar
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredCandidates.length === 0 && (
          <div className="no-results">
            <p>Nenhum candidato encontrado</p>
            <button onClick={handleAddCandidate} className="btn-add-empty">
              + Adicionar Primeiro Candidato
            </button>
          </div>
        )}
      </main>

      {showDetailsModal && (
        <CandidateDetailsModal candidate={selectedCandidate} onClose={() => setShowDetailsModal(false)} />
      )}

      {showEditModal && (
        <EditCandidateModal
          candidate={selectedCandidate}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            fetchCandidates()
          }}
        />
      )}
    </div>
  )
}
