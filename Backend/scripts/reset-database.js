import { fileURLToPath } from "url"
import { dirname, join } from "path"
import { existsSync, unlinkSync, mkdirSync } from "fs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dbPath = join(__dirname, "../data/users.db")
const dataDir = join(__dirname, "../data")

console.log(" Iniciando reset do banco de dados...")

// Criar diretório data se não existir
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
  console.log(" Diretório data criado")
}

// Deletar banco de dados corrompido se existir
if (existsSync(dbPath)) {
  try {
    unlinkSync(dbPath)
    console.log(" Banco de dados corrompido deletado com sucesso")
  } catch (error) {
    console.error(" Erro ao deletar banco de dados:", error.message)
    process.exit(1)
  }
}

console.log(' Reset concluído! Execute "npm run dev" para recriar o banco de dados.')
