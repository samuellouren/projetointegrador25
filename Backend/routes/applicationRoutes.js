import express from 'express'
import db from '../config/database.js'

const router = express.Router()

// Listar todas as aplicações
router.get('/applications', (req, res) => {
  try {
    console.log(' Buscando aplicações...')
    const applications = db.prepare(`
      SELECT 
        a.*,
        c.name as candidate_name,
        c.email as candidate_email,
        c.status as candidate_status,
        j.title as job_title,
        j.company as job_company
      FROM applications a
      JOIN candidates c ON a.candidate_id = c.id
      JOIN jobs j ON a.job_id = j.id
      ORDER BY a.applied_at DESC
    `).all()
    res.json(applications)
  } catch (error) {
    console.error('[v0] Erro ao buscar aplicações:', error)
    res.status(500).json({ message: 'Erro ao buscar aplicações' })
  }
})

// Buscar aplicações de uma vaga específica
router.get('/applications/job/:jobId', (req, res) => {
  try {
    const { jobId } = req.params
    console.log(' Buscando aplicações da vaga:', jobId)
    
    const applications = db.prepare(`
      SELECT 
        a.*,
        c.name as candidate_name,
        c.email as candidate_email,
        c.phone as candidate_phone,
        c.skills as candidate_skills,
        c.status as candidate_status
      FROM applications a
      JOIN candidates c ON a.candidate_id = c.id
      WHERE a.job_id = ?
      ORDER BY a.applied_at DESC
    `).all(jobId)
    
    res.json(applications)
  } catch (error) {
    console.error('[v0] Erro ao buscar aplicações:', error)
    res.status(500).json({ message: 'Erro ao buscar aplicações' })
  }
})

// Adicionar candidato a uma vaga
router.post('/applications', (req, res) => {
  try {
    const { candidate_id, job_id, compatibility = 0 } = req.body

    if (!candidate_id || !job_id) {
      return res.status(400).json({ 
        message: 'ID do candidato e da vaga são obrigatórios' 
      })
    }

    console.log(' Adicionando candidato', candidate_id, 'à vaga', job_id, 'com compatibilidade', compatibility)

    const stmt = db.prepare(`
      INSERT INTO applications (candidate_id, job_id, compatibility)
      VALUES (?, ?, ?)
    `)
    
    const result = stmt.run(candidate_id, job_id, compatibility)
    
    res.status(201).json({ 
      message: 'Candidato adicionado à vaga com sucesso',
      id: result.lastInsertRowid 
    })
  } catch (error) {
    console.error(' Erro ao adicionar aplicação:', error)
    
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ 
        message: 'Candidato já foi adicionado a esta vaga' 
      })
    }
    
    res.status(500).json({ message: 'Erro ao adicionar candidato à vaga' })
  }
})

router.put('/applications/:id/compatibility', (req, res) => {
  try {
    const { id } = req.params
    const { compatibility } = req.body

    if (compatibility === undefined || compatibility < 0 || compatibility > 100) {
      return res.status(400).json({ 
        message: 'Compatibilidade deve ser um número entre 0 e 100' 
      })
    }

    console.log(' Atualizando compatibilidade da aplicação:', id)

    const stmt = db.prepare(`
      UPDATE applications 
      SET compatibility = ?
      WHERE id = ?
    `)
    
    stmt.run(compatibility, id)
    
    res.json({ message: 'Compatibilidade atualizada com sucesso' })
  } catch (error) {
    console.error('[v0] Erro ao atualizar compatibilidade:', error)
    res.status(500).json({ message: 'Erro ao atualizar compatibilidade' })
  }
})

export default router
