import express from 'express'
import db from '../config/database.js'

const router = express.Router()

// Listar todas as vagas
router.get('/jobs', (req, res) => {
  try {
    console.log(' Buscando vagas...')
    const jobs = db.prepare('SELECT * FROM jobs ORDER BY created_at DESC').all()
    
    const jobsWithCounts = jobs.map(job => {
      const candidateCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM applications a
        JOIN candidates c ON a.candidate_id = c.id
        WHERE a.job_id = ? AND c.status = 'contratado'
      `).get(job.id)
      
      return {
        ...job,
        currentCandidatesCount: candidateCount.count || 0
      }
    })
    
    res.json(jobsWithCounts)
  } catch (error) {
    console.error(' Erro ao buscar vagas:', error)
    res.status(500).json({ message: 'Erro ao buscar vagas' })
  }
})

// Adicionar nova vaga
router.post('/jobs', (req, res) => {
  try {
    const { title, company, location, type, salary, description, requirements, keywords, max_candidates } = req.body

    // Validação básica
    if (!title || !company || !location || !description) {
      return res.status(400).json({ 
        message: 'Título, empresa, localização e descrição são obrigatórios' 
      })
    }

    console.log(' Adicionando vaga:', title)

    try {
      const stmt = db.prepare(`
        INSERT INTO jobs (title, company, location, type, salary, description, requirements, keywords, max_candidates)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      
      const result = stmt.run(
        title, 
        company, 
        location, 
        type || null, 
        salary || null, 
        description, 
        requirements || null,
        keywords || null,
        max_candidates ? parseInt(max_candidates) : 10
      )
      
      res.status(201).json({ 
        message: 'Vaga adicionada com sucesso',
        id: result.lastInsertRowid 
      })
    } catch (dbError) {
      console.error(' Erro no banco ao adicionar vaga:', dbError.message)
      res.status(500).json({ message: 'Erro ao adicionar vaga: ' + dbError.message })
    }
  } catch (error) {
    console.error(' Erro ao adicionar vaga:', error)
    res.status(500).json({ message: 'Erro ao adicionar vaga' })
  }
})

// Atualizar vaga
router.put('/jobs/:id', (req, res) => {
  try {
    const { id } = req.params
    const { title, company, location, type, salary, description, requirements, keywords, max_candidates } = req.body

    // Validação básica
    if (!title || !company || !location || !description) {
      return res.status(400).json({ 
        message: 'Título, empresa, localização e descrição são obrigatórios' 
      })
    }

    console.log(' Atualizando vaga:', id)

    const stmt = db.prepare(`
      UPDATE jobs 
      SET title = ?, company = ?, location = ?, type = ?, salary = ?, description = ?, requirements = ?, keywords = ?, max_candidates = ?
      WHERE id = ?
    `)
    
    const result = stmt.run(
      title, 
      company, 
      location, 
      type, 
      salary, 
      description, 
      requirements,
      keywords,
      max_candidates || 10,
      id
    )
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Vaga não encontrada' })
    }
    
    res.json({ message: 'Vaga atualizada com sucesso' })
  } catch (error) {
    console.error(' Erro ao atualizar vaga:', error)
    res.status(500).json({ message: 'Erro ao atualizar vaga' })
  }
})

// Deletar vaga
router.delete('/jobs/:id', (req, res) => {
  try {
    const { id } = req.params
    console.log(' Deletando vaga:', id)

    // Remove aplicações da vaga primeiro
    db.prepare('DELETE FROM applications WHERE job_id = ?').run(id)
    
    // Remove vaga
    const stmt = db.prepare('DELETE FROM jobs WHERE id = ?')
    const result = stmt.run(id)
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Vaga não encontrada' })
    }
    
    res.json({ message: 'Vaga removida com sucesso' })
  } catch (error) {
    console.error(' Erro ao deletar vaga:', error)
    res.status(500).json({ message: 'Erro ao deletar vaga' })
  }
})

// Buscar detalhes de uma vaga
router.get('/jobs/:id', (req, res) => {
  try {
    const { id } = req.params
    console.log(' Buscando vaga:', id)
    
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id)
    
    if (!job) {
      return res.status(404).json({ message: 'Vaga não encontrada' })
    }
    
    // Buscar candidatos aplicados nesta vaga
    const applications = db.prepare(`
      SELECT 
        c.*,
        a.status,
        a.applied_at
      FROM applications a
      JOIN candidates c ON a.candidate_id = c.id
      WHERE a.job_id = ?
      ORDER BY a.applied_at DESC
    `).all(id)
    
    res.json({ ...job, applications })
  } catch (error) {
    console.error(' Erro ao buscar vaga:', error)
    res.status(500).json({ message: 'Erro ao buscar vaga' })
  }
})

export default router
