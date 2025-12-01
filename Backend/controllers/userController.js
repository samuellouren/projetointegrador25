import bcrypt from "bcrypt" // Para criptografar senhas
import jwt from "jsonwebtoken" // Para criar tokens de autenticação
import User from "../models/User.js" // Modelo de usuário (acessa banco)

// Chave secreta para assinar tokens JWT
// Em produção, deve estar em variável de ambiente (.env)
const SECRET = process.env.JWT_SECRET || "senhasecreta123"

// ===== CONTROLLER =====
// Controlador gerencia a lógica de negócio da aplicação

class UserController {
  // ===== CADASTRO DE USUÁRIO =====
  static async register(req, res) {
    try {
      // 1. Pega dados enviados no corpo da requisição
      const { name, email, password } = req.body

      console.log(" Tentativa de cadastro:", { name, email })

      // 2. VALIDAÇÃO: Verifica se todos os campos foram preenchidos
      if (!name || !email || !password) {
        console.log(" Erro: Campos obrigatórios não preenchidos")
        return res.status(400).json({
          message: "Nome, email e senha são obrigatórios.",
        })
      }

      // 3. Normaliza email (remove espaços e deixa em minúsculas)
      const normalizedEmail = email.trim().toLowerCase()
      console.log(" Email normalizado:", normalizedEmail)

      // 4. Verifica se usuário já existe
      const userExists = User.findByEmail(normalizedEmail)
      if (userExists) {
        console.log(" Erro: Email já cadastrado")
        return res.status(400).json({
          message: "Este email já está cadastrado.",
        })
      }

      // 5. Criptografa senha (10 = número de "rodadas" de criptografia)
      // Quanto maior o número, mais seguro, mas mais lento
      const hashedPassword = await bcrypt.hash(password, 10)
      console.log(" Senha criptografada com sucesso")

      // 6. Cria usuário no banco de dados
      const userId = User.create(name, normalizedEmail, hashedPassword)
      console.log(" Usuário criado com ID:", userId)

      // 7. Retorna sucesso
      res.status(201).json({
        message: "Usuário cadastrado com sucesso!",
        userId: userId,
      })
    } catch (err) {
      // Se algo der errado, loga o erro e retorna mensagem genérica
      console.error("[v0] Erro no cadastro:", err)
      res.status(500).json({
        message: "Erro ao cadastrar usuário. Tente novamente.",
      })
    }
  }

  // ===== LOGIN DE USUÁRIO =====
  static async login(req, res) {
    try {
      // 1. Pega credenciais enviadas
      const { email, password } = req.body

      console.log(" Tentativa de login:", { email })

      // 2. VALIDAÇÃO: Verifica se campos foram preenchidos
      if (!email || !password) {
        console.log(" Erro: Email ou senha não fornecidos")
        return res.status(400).json({
          message: "Email e senha são obrigatórios.",
        })
      }

      // 3. Normaliza email
      const normalizedEmail = email.trim().toLowerCase()

      // 4. Busca usuário no banco de dados
      const user = User.findByEmail(normalizedEmail)
      if (!user) {
        console.log(" Erro: Usuário não encontrado")
        return res.status(400).json({
          message: "Email ou senha incorretos.", // Mensagem genérica por segurança
        })
      }

      console.log(" Usuário encontrado:", user.name)

      // 5. Compara senha digitada com senha criptografada do banco
      const senhaCorreta = await bcrypt.compare(password, user.password)
      if (!senhaCorreta) {
        console.log(" Erro: Senha incorreta")
        return res.status(401).json({
          message: "Email ou senha incorretos.",
        })
      }

      console.log(" Senha correta, gerando token...")

      // 6. Gera token JWT (JSON Web Token)
      // Token é como uma "chave de acesso" que prova que o usuário está logado
      const token = jwt.sign(
        { id: user.id, email: user.email }, // Dados que vão dentro do token
        SECRET, // Chave secreta para assinar
        { expiresIn: "24h" }, // Token expira em 24 horas
      )

      console.log(" Token gerado com sucesso")

      // 7. Retorna sucesso com token
      res.json({
        message: "Login realizado com sucesso!",
        token: token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
    } catch (err) {
      console.error(" Erro no login:", err)
      res.status(500).json({
        message: "Erro ao fazer login. Tente novamente.",
      })
    }
  }

  // ===== LISTAR TODOS OS USUÁRIOS =====
  // Esta rota é protegida (requer autenticação)
  static getUsers(req, res) {
    try {
      console.log(" Listando todos os usuários")

      // Busca todos os usuários
      const users = User.getAll()

      // Remove senhas antes de enviar
      const usersWithoutPasswords = users.map((user) => {
        const { password, ...userWithoutPassword } = user
        return userWithoutPassword
      })

      res.json(usersWithoutPasswords)
    } catch (err) {
      console.error(" Erro ao listar usuários:", err)
      res.status(500).json({
        message: "Erro ao listar usuários.",
      })
    }
  }

  // ===== BUSCAR USUÁRIO POR ID =====
  static getUserById(req, res) {
    try {
      // Pega ID da URL (ex: /api/users/5)
      const { id } = req.params

      console.log(" Buscando usuário com ID:", id)

      const user = User.findById(id)

      if (!user) {
        console.log(" Usuário não encontrado")
        return res.status(404).json({
          message: "Usuário não encontrado.",
        })
      }

      // Remove senha antes de enviar
      const { password, ...userWithoutPassword } = user

      res.json(userWithoutPassword)
    } catch (err) {
      console.error(" Erro ao buscar usuário:", err)
      res.status(500).json({
        message: "Erro ao buscar usuário.",
      })
    }
  }

  // ===== ATUALIZAR PERFIL DO USUÁRIO LOGADO =====
  static async updateProfile(req, res) {
    try {
      const userId = req.userId
      const { name, email } = req.body

      console.log(" Atualizando perfil do usuário:", userId)

      // Validação
      if (!name || !email) {
        return res.status(400).json({
          message: "Nome e email são obrigatórios.",
        })
      }

      // Normaliza email
      const normalizedEmail = email.trim().toLowerCase()

      // Verifica se o novo email já está em uso por outro usuário
      const existingUser = User.findByEmail(normalizedEmail)
      if (existingUser && existingUser.id !== Number.parseInt(userId)) {
        return res.status(400).json({
          message: "Este email já está em uso.",
        })
      }

      // Atualiza usuário
      const updated = User.update(userId, { name, email: normalizedEmail })

      if (!updated) {
        return res.status(404).json({
          message: "Erro ao atualizar perfil.",
        })
      }

      // Busca dados atualizados
      const updatedUser = User.findById(userId)
      const { password, ...userWithoutPassword } = updatedUser

      console.log(" Perfil atualizado com sucesso")
      res.json({
        message: "Perfil atualizado com sucesso!",
        user: userWithoutPassword,
      })
    } catch (err) {
      console.error(" Erro ao atualizar perfil:", err)
      res.status(500).json({
        message: "Erro ao atualizar perfil.",
      })
    }
  }

  // ===== ALTERAR SENHA DO USUÁRIO LOGADO =====
  static async updatePassword(req, res) {
    try {
      const userId = req.userId
      const { currentPassword, newPassword } = req.body

      console.log(" Alterando senha do usuário:", userId)

      // Validação
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          message: "Senha atual e nova senha são obrigatórias.",
        })
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          message: "A nova senha deve ter pelo menos 6 caracteres.",
        })
      }

      // Busca usuário
      const user = User.findById(userId)
      if (!user) {
        return res.status(404).json({
          message: "Usuário não encontrado.",
        })
      }

      // Verifica se a senha atual está correta
      const senhaCorreta = await bcrypt.compare(currentPassword, user.password)
      if (!senhaCorreta) {
        return res.status(401).json({
          message: "Senha atual incorreta.",
        })
      }

      // Criptografa nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      // Atualiza senha no banco
      User.updatePassword(userId, hashedPassword)

      console.log(" Senha alterada com sucesso")
      res.json({
        message: "Senha alterada com sucesso!",
      })
    } catch (err) {
      console.error("[v0] Erro ao alterar senha:", err)
      res.status(500).json({
        message: "Erro ao alterar senha.",
      })
    }
  }

  // ===== ATUALIZAR USUÁRIO =====
  static async updateUser(req, res) {
    try {
      const { id } = req.params
      const { name, email } = req.body

      console.log(" Atualizando usuário:", id)

      const updated = User.update(id, { name, email })

      if (!updated) {
        console.log(" Usuário não encontrado ou sem alterações")
        return res.status(404).json({
          message: "Usuário não encontrado.",
        })
      }

      console.log(" Usuário atualizado com sucesso")
      res.json({
        message: "Usuário atualizado com sucesso!",
      })
    } catch (err) {
      console.error(" Erro ao atualizar usuário:", err)
      res.status(500).json({
        message: "Erro ao atualizar usuário.",
      })
    }
  }

  // ===== DELETAR USUÁRIO =====
  static deleteUser(req, res) {
    try {
      const { id } = req.params

      console.log(" Deletando usuário:", id)

      const deleted = User.delete(id)

      if (!deleted) {
        console.log(" Usuário não encontrado")
        return res.status(404).json({
          message: "Usuário não encontrado.",
        })
      }

      console.log(" Usuário deletado com sucesso")
      res.json({
        message: "Usuário deletado com sucesso!",
      })
    } catch (err) {
      console.error(" Erro ao deletar usuário:", err)
      res.status(500).json({
        message: "Erro ao deletar usuário.",
      })
    }
  }
}

export default UserController
