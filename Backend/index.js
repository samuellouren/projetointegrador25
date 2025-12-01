import express from "express"
import cors from "cors"
import authRoutes from "./routes/authRoutes.js"
import userRoutes from "./routes/userRoutes.js"

const app = express()
const PORT = process.env.PORT || 3333

app.use(cors())
app.use(express.json())

app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "API está funcionando!" })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: "Algo deu errado!" })
})

app.listen(PORT, () => {
  console.log(` Servidor rodando na porta ${PORT}`)
  console.log(` API disponível em http://localhost:${PORT}/api`)
})
