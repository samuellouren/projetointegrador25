"use client"

import { useState } from "react"
import axios from "axios"
import "./Modal.css"

export default function EditJobModal({ job, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: job.title || "",
    company: job.company || "",
    location: job.location || "",
    type: job.type || "CLT",
    salary: job.salary || "",
    description: job.description || "",
    requirements: job.requirements || "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title || !formData.company || !formData.location || !formData.description) {
      alert("Título, empresa, localização e descrição são obrigatórios")
      return
    }

    setLoading(true)

    try {
      await axios.put(`http://localhost:3333/api/jobs/${job.id}`, formData)
      alert("Vaga atualizada com sucesso!")
      onSuccess()
    } catch (error) {
      console.error("[v0] Erro ao atualizar vaga:", error)
      alert(error.response?.data?.message || "Erro ao atualizar vaga")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Vaga</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label>Título da Vaga *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Empresa *</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Localização *</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Tipo de Contrato</label>
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
              <option value="CLT">CLT</option>
              <option value="PJ">PJ</option>
              <option value="Estágio">Estágio</option>
              <option value="Temporário">Temporário</option>
            </select>
          </div>

          <div className="form-group">
            <label>Salário</label>
            <input
              type="text"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              placeholder="Ex: R$ 5.000,00"
            />
          </div>

          <div className="form-group">
            <label>Descrição *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="4"
              required
            />
          </div>

          <div className="form-group">
            <label>Requisitos</label>
            <textarea
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              rows="4"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancelar
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
