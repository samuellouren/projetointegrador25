import jwt from "jsonwebtoken"

const SECRET = process.env.JWT_SECRET || "senhasecreta123"

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({
      message: "Token não fornecido.",
    })
  }

  const token = authHeader.replace("Bearer ", "")

  try {
    const decoded = jwt.verify(token, SECRET)
    req.userId = decoded.id
    req.userEmail = decoded.email
    next()
  } catch (err) {
    return res.status(401).json({
      message: "Token inválido ou expirado.",
    })
  }
}

export default authMiddleware
