import express from 'express'
import db from '../config/database.js'

const router = express.Router()

function calculateCompatibility(candidateSkills, jobKeywords) {
  if (!candidateSkills || !jobKeywords) return 0
  
  const skills = candidateSkills.toLowerCase().split(',').map(s => s.trim())
  const keywords = jobKeywords.toLowerCase().split(',').map(k => k.trim())
  
  if (keywords.length === 0) return 0
  
  let matches = 0
  keywords.forEach(keyword => {
    if (skills.some(skill => skill.includes(keyword) || keyword.includes(skill))) {
      matches++
    }
  })
  
  return Math.round((matches / keywords.length) * 100)
}

// Listar todos os candidatos com contagem de aplicações e compatibilidade média
router.get('/candidates', (req, res) => {
  try {
    console.log(' Buscando candidatos com compatibilidade...')
    
    const candidates = db.prepare(`
      SELECT 
        c.*,
        COUNT(a.id) as applications_count
      FROM candidates c
      LEFT JOIN applications a ON c.id = a.candidate_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `).all()
    
    const candidatesWithCompatibility = candidates.map(candidate => {
      const applications = db.prepare(`
        SELECT 
          j.*,
          a.status,
          a.applied_at,
          a.compatibility,
          a.job_id
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        WHERE a.candidate_id = ?
        ORDER BY a.applied_at DESC
      `).all(candidate.id)
      
      let avgCompatibility = 0
      if (applications.length > 0) {
        const total = applications.reduce((sum, app) => {
          const comp = app.compatibility || calculateCompatibility(candidate.skills, app.keywords)
          return sum + comp
        }, 0)
        avgCompatibility = Math.round(total / applications.length)
      }
      
      return {
        ...candidate,
        avg_compatibility: avgCompatibility,
        applications: applications
      }
    })
    
    console.log(' Candidatos encontrados:', candidatesWithCompatibility.length)
    res.json(candidatesWithCompatibility)
  } catch (error) {
    console.error(' Erro ao buscar candidatos:', error)
    res.status(500).json({ message: 'Erro ao buscar candidatos' })
  }
})

// Adicionar novo candidato
router.post('/candidates', (req, res) => {
  try {
    const { name, email, phone, skills, experience, education, status = 'novo' } = req.body

    // Validação básica
    if (!name || !email) {
      return res.status(400).json({ message: 'Nome e email são obrigatórios' })
    }

    console.log(' Adicionando candidato:', name)

    // Insere candidato no banco
    const stmt = db.prepare(`
      INSERT INTO candidates (name, email, phone, skills, experience, education, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    const result = stmt.run(name, email, phone, skills, experience, education, status)
    
    res.status(201).json({ 
      message: 'Candidato adicionado com sucesso',
      id: result.lastInsertRowid 
    })
  } catch (error) {
    console.error(' Erro ao adicionar candidato:', error)
    
    // Verifica se é erro de email duplicado
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ message: 'Email já cadastrado' })
    }
    
    res.status(500).json({ message: 'Erro ao adicionar candidato' })
  }
})

// Atualizar candidato
router.put('/candidates/:id', (req, res) => {
  try {
    const { id } = req.params
    const { name, email, phone, skills, experience, education, status } = req.body

    // Validação básica
    if (!name || !email) {
      return res.status(400).json({ message: 'Nome e email são obrigatórios' })
    }

    console.log(' Atualizando candidato:', id)

    // Atualiza candidato no banco
    const stmt = db.prepare(`
      UPDATE candidates 
      SET name = ?, email = ?, phone = ?, skills = ?, experience = ?, education = ?, status = ?
      WHERE id = ?
    `)
    
    const result = stmt.run(name, email, phone, skills, experience, education, status, id)
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Candidato não encontrado' })
    }
    
    res.json({ message: 'Candidato atualizado com sucesso' })
  } catch (error) {
    console.error(' Erro ao atualizar candidato:', error)
    
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ message: 'Email já cadastrado' })
    }
    
    res.status(500).json({ message: 'Erro ao atualizar candidato' })
  }
})

// Atualizar status do candidato com validação de limite de candidatos contratados
router.put('/candidates/:id/status', (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = ['novo', 'entrevista', 'contratado', 'recusado']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Status inválido. Use: novo, entrevista, contratado ou recusado' 
      })
    }

    if (status === 'contratado') {
      const candidateApplications = db.prepare(`
        SELECT DISTINCT a.job_id
        FROM applications a
        WHERE a.candidate_id = ?
      `).all(id)

      for (const app of candidateApplications) {
        const job = db.prepare('SELECT max_candidates FROM jobs WHERE id = ?').get(app.job_id)
        const hiredCount = db.prepare(`
          SELECT COUNT(*) as count
          FROM applications a
          JOIN candidates c ON a.candidate_id = c.id
          WHERE a.job_id = ? AND c.status = 'contratado'
        `).get(app.job_id)

        if (job && hiredCount.count >= job.max_candidates) {
          return res.status(400).json({
            message: `Limite de candidatos contratados para esta vaga foi atingido (${job.max_candidates} máximo)`
          })
        }
      }
    }

    console.log(' Atualizando status do candidato:', id, 'para', status)

    const stmt = db.prepare(`
      UPDATE candidates 
      SET status = ?
      WHERE id = ?
    `)
    
    stmt.run(status, id)
    
    res.json({ message: 'Status atualizado com sucesso' })
  } catch (error) {
    console.error(' Erro ao atualizar status:', error)
    res.status(500).json({ message: 'Erro ao atualizar status' })
  }
})

// Deletar candidato
router.delete('/candidates/:id', (req, res) => {
  try {
    const { id } = req.params
    console.log(' Deletando candidato:', id)

    // Remove aplicações do candidato primeiro
    db.prepare('DELETE FROM applications WHERE candidate_id = ?').run(id)
    
    // Remove candidato
    const stmt = db.prepare('DELETE FROM candidates WHERE id = ?')
    const result = stmt.run(id)
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Candidato não encontrado' })
    }
    
    res.json({ message: 'Candidato removido com sucesso' })
  } catch (error) {
    console.error(' Erro ao deletar candidato:', error)
    res.status(500).json({ message: 'Erro ao deletar candidato' })
  }
})

// Buscar candidato específico
router.get('/candidates/:id', (req, res) => {
  try {
    const { id } = req.params
    console.log(' Buscando candidato:', id)
    
    const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(id)
    
    if (!candidate) {
      return res.status(404).json({ message: 'Candidato não encontrado' })
    }
    
    const applications = db.prepare(`
      SELECT 
        j.*,
        a.status,
        a.applied_at,
        a.compatibility,
        a.job_id
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.candidate_id = ?
      ORDER BY a.applied_at DESC
    `).all(id)
    
    const applicationsWithCompatibility = applications.map(app => ({
      ...app,
      compatibility: app.compatibility || calculateCompatibility(candidate.skills, app.keywords)
    }))
    
    res.json({ ...candidate, applications: applicationsWithCompatibility })
  } catch (error) {
    console.error(' Erro ao buscar candidato:', error)
    res.status(500).json({ message: 'Erro ao buscar candidato' })
  }
})

// Candidatar um candidato a uma vaga específica
router.post('/candidates/:candidateId/apply/:jobId', (req, res) => {
  try {
    const { candidateId, jobId } = req.params
    console.log(' Candidatando candidato', candidateId, 'para vaga', jobId)
    
    const stmt = db.prepare(`
      INSERT INTO applications (candidate_id, job_id)
      VALUES (?, ?)
    `)
    
    const result = stmt.run(candidateId, jobId)
    
    res.status(201).json({ 
      message: 'Candidato adicionado à vaga com sucesso',
      id: result.lastInsertRowid 
    })
  } catch (error) {
    console.error(' Erro ao candidatar:', error)
    
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ message: 'Candidato já está nesta vaga' })
    }
    
    res.status(500).json({ message: 'Erro ao candidatar à vaga' })
  }
})

// Listar candidatos de uma vaga específica com informações completas
router.get('/applications/job/:jobId', (req, res) => {
  try {
    const { jobId } = req.params
    console.log(' Buscando candidatos da vaga:', jobId)
    
    const applications = db.prepare(`
      SELECT 
        a.id,
        a.candidate_id,
        a.job_id,
        a.status,
        a.applied_at,
        a.compatibility,
        c.name as candidateName,
        c.email as candidateEmail,
        c.phone as candidatePhone,
        c.skills,
        c.experience,
        c.education
      FROM applications a
      JOIN candidates c ON a.candidate_id = c.id
      WHERE a.job_id = ?
      ORDER BY a.compatibility DESC, a.applied_at DESC
    `).all(jobId)
    
    console.log(' Candidatos encontrados para vaga:', applications.length)
    res.json(applications)
  } catch (error) {
    console.error('[v0] Erro ao buscar candidatos da vaga:', error)
    res.status(500).json({ message: 'Erro ao buscar candidatos da vaga' })
  }
})

export default router
