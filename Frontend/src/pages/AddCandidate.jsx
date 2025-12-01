"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import Header from "../components/Header"
import "./AddCandidate.css"

export default function AddCandidate() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    experience: "",
    education: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [jobKeywords, setJobKeywords] = useState([])
  const [selectedSkills, setSelectedSkills] = useState([])
  const [jobApplications, setJobApplications] = useState([])

  useEffect(() => {
    axios
      .get("http://localhost:3333/api/jobs")
      .then((response) => setJobs(response.data))
      .catch((error) => console.error("Erro ao buscar vagas:", error))
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectJob = (e) => {
    const jobId = Number.parseInt(e.target.value)
    if (!jobId) {
      setSelectedJob(null)
      setJobKeywords([])
      setSelectedSkills([])
      return
    }

    const job = jobs.find((j) => j.id === jobId)
    setSelectedJob(job)

    console.log(" Vaga selecionada:", job)
    console.log(" Keywords string:", job.keywords)

    // Extrair as keywords da vaga
    const keywords = job.keywords
      ? job.keywords
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k)
      : []
    console.log(" Keywords processadas:", keywords)

    setJobKeywords(keywords)
    setSelectedSkills([])
  }

  const handleSkillToggle = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill))
    } else {
      setSelectedSkills([...selectedSkills, skill])
    }
  }

  const calculateCompatibility = () => {
    if (jobKeywords.length === 0) return 0
    return Math.round((selectedSkills.length / jobKeywords.length) * 100)
  }

  const handleAddJobApplication = () => {
    if (!selectedJob || selectedSkills.length === 0) {
      alert("Selecione uma vaga e pelo menos uma competência")
      return
    }

    if (jobApplications.some((app) => app.jobId === selectedJob.id)) {
      alert("Esta vaga já foi adicionada. Remova-a antes de adicionar novamente.")
      return
    }

    const currentCandidatesCount = jobs.find((j) => j.id === selectedJob.id)?.currentCandidatesCount || 0

    if (currentCandidatesCount >= selectedJob.max_candidates) {
      alert(`Esta vaga atingiu o limite de ${selectedJob.max_candidates} candidatos.`)
      return
    }

    const compatibility = calculateCompatibility()

    setJobApplications((prev) => [
      ...prev,
      {
        jobId: selectedJob.id,
        jobTitle: selectedJob.title,
        skills: selectedSkills,
        compatibility,
      },
    ])

    setSelectedJob(null)
    setJobKeywords([])
    setSelectedSkills([])
  }

  const handleRemoveJobApplication = (jobId) => {
    setJobApplications((prev) => prev.filter((app) => app.jobId !== jobId))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const allSkills = []
      jobApplications.forEach((app) => {
        allSkills.push(...app.skills)
      })
      const uniqueSkills = [...new Set(allSkills)]

      const candidateData = {
        ...formData,
        skills: uniqueSkills.join(", "),
      }

      const response = await axios.post("http://localhost:3333/api/candidates", candidateData)
      const candidateId = response.data.id

      for (const app of jobApplications) {
        await axios.post("http://localhost:3333/api/applications", {
          candidate_id: candidateId,
          job_id: app.jobId,
          compatibility: app.compatibility,
        })
      }

      alert("Candidato adicionado com sucesso!")
      navigate("/candidates")
    } catch (error) {
      console.error("Erro ao adicionar candidato:", error)
      setError(error.response?.data?.message || "Erro ao adicionar candidato")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="add-candidate-container">
      <Header />

      <main className="add-candidate-main">
        <div className="form-wrapper">
          <h2>Adicionar Novo Candidato</h2>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="candidate-form">
            <div className="form-group">
              <label htmlFor="name">Nome Completo *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Digite o nome completo"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="exemplo@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Telefone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="form-group">
              <label>Competências do Candidato *</label>

              <div className="job-selection-wrapper">
                <select onChange={handleSelectJob} value={selectedJob?.id || ""} className="job-select">
                  <option value="">Selecione uma vaga para adicionar competências</option>
                  {jobs.map((job) => {
                    const candidatosAtual = job.currentCandidatesCount || 0
                    const estouCheia = candidatosAtual >= job.max_candidates
                    return (
                      <option key={job.id} value={job.id} disabled={estouCheia}>
                        {job.title} - {job.company}
                        {estouCheia ? " (CHEIA)" : ` (${candidatosAtual}/${job.max_candidates})`}
                      </option>
                    )
                  })}
                </select>
              </div>

              {selectedJob && jobKeywords.length > 0 && (
                <div className="skills-selection">
                  <div className="skills-header-new">
                    <div>
                      <h4>Selecione as competências que o candidato possui:</h4>
                      <p className="skills-subtitle">Marque as competências que correspondem ao perfil do candidato</p>
                    </div>
                    {selectedSkills.length > 0 && (
                      <div className="compatibility-display">
                        <div
                          className="compatibility-circle"
                          style={{
                            backgroundColor:
                              calculateCompatibility() >= 80
                                ? "#10b981"
                                : calculateCompatibility() >= 60
                                  ? "#f59e0b"
                                  : calculateCompatibility() >= 40
                                    ? "#f97316"
                                    : "#ef4444",
                          }}
                        >
                          <span className="compatibility-percentage">{calculateCompatibility()}%</span>
                        </div>
                        <div className="compatibility-info">
                          <p className="compatibility-label">Compatibilidade</p>
                          <p className="compatibility-value">
                            {selectedSkills.length}/{jobKeywords.length}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="keywords-checkboxes-new">
                    {jobKeywords.map((keyword) => (
                      <label key={keyword} className="checkbox-card">
                        <input
                          type="checkbox"
                          checked={selectedSkills.includes(keyword)}
                          onChange={() => handleSkillToggle(keyword)}
                          className="checkbox-input"
                        />
                        <div className="checkbox-card-content">
                          <div className="checkbox-card-box">
                            {selectedSkills.includes(keyword) && <span className="checkmark">✓</span>}
                          </div>
                          <span className="checkbox-card-text">{keyword}</span>
                        </div>
                      </label>
                    ))}
                  </div>

                  {selectedSkills.length > 0 && (
                    <div className="selected-skills-display">
                      <p className="selected-skills-label">Competências selecionadas:</p>
                      <div className="selected-skills-tags">
                        {selectedSkills.map((skill) => (
                          <span key={skill} className="skill-badge">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button type="button" onClick={handleAddJobApplication} className="btn-add-job-application-new">
                    Adicionar Vaga
                  </button>
                </div>
              )}

              {selectedJob && jobKeywords.length === 0 && (
                <div className="no-keywords-message">Esta vaga não possui competências desejadas cadastradas.</div>
              )}

              {jobApplications.length > 0 && (
                <div className="job-applications-list">
                  <h4>Vagas Adicionadas:</h4>
                  {jobApplications.map((app) => (
                    <div key={app.jobId} className="job-application-item">
                      <div className="job-app-header">
                        <strong>{app.jobTitle}</strong>
                        <span
                          className="compatibility-badge"
                          style={{
                            backgroundColor:
                              app.compatibility >= 80
                                ? "rgba(16, 185, 129, 0.2)"
                                : app.compatibility >= 60
                                  ? "rgba(245, 158, 11, 0.2)"
                                  : app.compatibility >= 40
                                    ? "rgba(249, 115, 22, 0.2)"
                                    : "rgba(239, 68, 68, 0.2)",
                            color:
                              app.compatibility >= 80
                                ? "#10b981"
                                : app.compatibility >= 60
                                  ? "#f59e0b"
                                  : app.compatibility >= 40
                                    ? "#f97316"
                                    : "#ef4444",
                          }}
                        >
                          {app.compatibility}% compatível
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveJobApplication(app.jobId)}
                          className="btn-remove-job-app"
                          title="Remover vaga"
                        >
                          ×
                        </button>
                      </div>
                      <div className="job-app-skills">
                        {app.skills.map((skill) => (
                          <span key={skill} className="skill-tag-small">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="experience">Experiência</label>
              <textarea
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                rows="4"
                placeholder="Descreva a experiência profissional"
              />
            </div>

            <div className="form-group">
              <label htmlFor="education">Formação</label>
              <input
                type="text"
                id="education"
                name="education"
                value={formData.education}
                onChange={handleChange}
                placeholder="Ex: Bacharelado em Ciência da Computação"
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => navigate("/candidates")} className="btn-cancel" disabled={loading}>
                Cancelar
              </button>
              <button type="submit" className="btn-submit" disabled={loading || jobApplications.length === 0}>
                {loading ? "Salvando..." : "Adicionar Candidato"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
