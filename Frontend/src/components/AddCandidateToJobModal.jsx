"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import "./Modal.css"

export default function AddCandidateToJobModal({ job, onClose, onSuccess }) {
  const [candidates, setCandidates] = useState([])
  const [selectedCandidate, setSelectedCandidate] = useState("")
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchCandidates()
  }, [])

  const fetchCandidates = async () => {
    try {
      const response = await axios.get("http://localhost:3333/api/candidates")
      setCandidates(response.data)
    } catch (error) {
      console.error("[v0] Erro ao buscar candidatos:", error)
      alert("Erro ao buscar candidatos")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedCandidate) {
      alert("Selecione um candidato")
      return
    }

    setLoading(true)

    try {
      await axios.post("http://localhost:3333/api/applications", {
        candidate_id: selectedCandidate,
        job_id: job.id,
      })

      alert("Candidato adicionado à vaga com sucesso!")
      onSuccess()
    } catch (error) {
      console.error("[v0] Erro ao adicionar candidato:", error)
      alert(error.response?.data?.message || "Erro ao adicionar candidato à vaga")
    } finally {
      setLoading(false)
    }
  }

  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Adicionar Candidato</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="job-info">
            <h3>{job.title}</h3>
            <p>{job.company}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Buscar Candidato:</label>
              <input
                type="text"
                placeholder="Digite o nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="modal-input"
              />
            </div>

            <div className="form-group">
              <label>Selecionar Candidato:</label>
              <select
                value={selectedCandidate}
                onChange={(e) => setSelectedCandidate(e.target.value)}
                className="modal-select"
                required
              >
                <option value="">Selecione um candidato</option>
                {filteredCandidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name} - {candidate.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? "Adicionando..." : "Adicionar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
