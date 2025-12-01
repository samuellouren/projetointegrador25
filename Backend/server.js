// Importa bibliotecas necessárias
import express from "express" // Framework para criar servidor web
import cors from "cors" // Permite que frontend e backend se comuniquem
import authRoutes from "./routes/authRoutes.js" // Rotas de autenticação
import candidateRoutes from "./routes/candidateRoutes.js"
import jobRoutes from "./routes/jobRoutes.js"
import applicationRoutes from "./routes/applicationRoutes.js"

// Cria aplicação Express
const app = express()

// Define porta do servidor (onde o backend vai rodar)
const PORT = 3333

// ===== MIDDLEWARES =====
// Middlewares são funções que processam requisições antes de chegarem nas rotas

// 1. CORS - Permite requisições do frontend (http://localhost:5173)
app.use(cors())

// 2. JSON Parser - Converte JSON recebido em objeto JavaScript
app.use(express.json())

// ===== ROTAS =====


app.use("/api/auth", authRoutes)

// Rotas públicas
app.use("/api", candidateRoutes)
app.use("/api", jobRoutes)
app.use("/api", applicationRoutes)

// ===== TRATAMENTO DE ERROS =====

// Rota não encontrada (404)
app.use((req, res) => {
  res.status(404).json({
    message: `Rota ${req.url} não encontrada`,
  })
})

// Erro interno do servidor (500)
app.use((err, req, res, next) => {
  console.error(" Erro:", err.stack)
  res.status(500).json({
    message: "Erro interno no servidor",
  })
})

// ===== INICIALIZAÇÃO DO SERVIDOR =====

// Inicia o servidor na porta definida
app.listen(PORT, () => {
  console.log(`\n Servidor rodando em http://localhost:${PORT}`)
  console.log(` API disponível em http://localhost:${PORT}/api`)
  console.log(" Rotas disponíveis:")
  console.log("  POST /api/auth/register  - Cadastro de usuário")
  console.log("  POST /api/auth/login     - Login de usuário")
  console.log("  GET  /api/candidates     - Listar candidatos")
  console.log("  POST /api/candidates     - Adicionar candidato")
  console.log("  GET  /api/candidates/:id - Ver detalhes do candidato")
  console.log("  GET  /api/jobs           - Listar vagas")
  console.log("  POST /api/jobs           - Adicionar vaga")
  console.log("  GET  /api/jobs/:id       - Ver detalhes da vaga")
  console.log("  POST /api/applications   - Adicionar candidato a vaga")
  console.log("  GET  /api/applications   - Listar todas aplicações")
  console.log("")
})
