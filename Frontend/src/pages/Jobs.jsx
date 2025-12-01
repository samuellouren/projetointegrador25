"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import Header from "../components/Header"
import JobDetailsModal from "../components/JobDetailsModal"
import EditJobModal from "../components/EditJobModal"
import "./Jobs.css"

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedJob, setSelectedJob] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCandidatesModal, setShowCandidatesModal] = useState(false)
  const [jobCandidates, setJobCandidates] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchJobs()
  }, [])

  useEffect(() => {
    const filtered = jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredJobs(filtered)
  }, [searchTerm, jobs])

  const fetchJobs = async () => {
    try {
      const response = await axios.get("http://localhost:3333/api/jobs")
      console.log(" Vagas carregadas:", response.data)
      setJobs(response.data)
      setFilteredJobs(response.data)
    } catch (error) {
      console.error(" Erro ao buscar vagas:", error)
      alert("Erro ao buscar vagas. Verifique se o servidor está rodando.")
    }
  }

  const handleAddJob = () => {
    navigate("/add-job")
  }

  const handleViewDetails = async (job) => {
    try {
      const response = await axios.get(`http://localhost:3333/api/jobs/${job.id}`)
      setSelectedJob(response.data)
      setShowDetailsModal(true)
    } catch (error) {
      console.error(" Erro ao buscar detalhes:", error)
      alert("Erro ao buscar detalhes da vaga")
    }
  }

  const handleViewCandidates = async (job) => {
    try {
      const response = await axios.get(`http://localhost:3333/api/applications/job/${job.id}`)
      console.log(" Candidatos da vaga:", response.data)
      setJobCandidates(response.data)
      setSelectedJob(job)
      setShowCandidatesModal(true)
    } catch (error) {
      console.error(" Erro ao buscar candidatos:", error)
      alert("Erro ao buscar candidatos da vaga")
    }
  }

  const handleEdit = (job) => {
    setSelectedJob(job)
    setShowEditModal(true)
  }

  const handleDelete = async (job) => {
    if (!confirm(`Tem certeza que deseja deletar a vaga ${job.title}?`)) {
      return
    }

    try {
      await axios.delete(`http://localhost:3333/api/jobs/${job.id}`)
      alert("Vaga deletada com sucesso!")
      fetchJobs()
    } catch (error) {
      console.error("[v0] Erro ao deletar vaga:", error)
      alert("Erro ao deletar vaga")
    }
  }

  return (
    <div className="jobs-container">
      <Header />

      <main className="jobs-main">
        <div className="search-section">
          <div className="section-header">
            <h2>Vagas Disponíveis</h2>
            <button onClick={handleAddJob} className="btn-add">
              + Adicionar Vaga
            </button>
          </div>

          <input
            type="text"
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="jobs-grid">
          {filteredJobs.map((job) => (
            <div key={job.id} className="job-card">
              <div className="job-header">
                <h3>{job.title}</h3>
                <span className="job-type">{job.type}</span>
              </div>

              <p className="company">{job.company}</p>
              <p className="location">{job.location}</p>

              <p className="description">{job.description}</p>

              <div className="job-footer">
                <span className="salary">{job.salary}</span>
                <div className="job-actions">
                  <button className="btn-details" onClick={() => handleViewDetails(job)}>
                    Detalhes
                  </button>
                  <button className="btn-candidates" onClick={() => handleViewCandidates(job)}>
                    Ver Candidatos
                  </button>
                  <button className="btn-edit" onClick={() => handleEdit(job)}>
                    Editar
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(job)}>
                    Deletar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="no-results">
            <p>Nenhuma vaga encontrada</p>
            <button onClick={handleAddJob} className="btn-add-empty">
              + Adicionar Primeira Vaga
            </button>
          </div>
        )}
      </main>

      {showDetailsModal && <JobDetailsModal job={selectedJob} onClose={() => setShowDetailsModal(false)} />}

      {showEditModal && (
        <EditJobModal
          job={selectedJob}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            fetchJobs()
          }}
        />
      )}

      {showCandidatesModal && (
        <div className="modal-overlay" onClick={() => setShowCandidatesModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Candidatos - {selectedJob?.title}</h2>
              <button className="close-btn" onClick={() => setShowCandidatesModal(false)}>
                ✕
              </button>
            </div>

            <div className="candidates-list">
              {jobCandidates.length === 0 ? (
                <p className="no-candidates">Nenhum candidato para esta vaga</p>
              ) : (
                jobCandidates.map((application) => (
                  <div key={application.id} className="candidate-item">
                    <div className="candidate-info">
                      <h4>{application.candidateName}</h4>
                      <p className="candidate-email">{application.candidateEmail}</p>
                      <p className="candidate-phone">{application.candidatePhone}</p>
                    </div>
                    <div className="compatibility-badge">
                      <span
                        className={`compatibility-score compatibility-${Math.round(application.compatibility / 25)}`}
                      >
                        {Math.round(application.compatibility)}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
