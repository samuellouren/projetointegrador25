import express from 'express'
import UserController from '../controllers/userController.js'
import authMiddleware from '../middlewares/authMiddleware.js'

const router = express.Router()

// Public routes
router.post('/register', UserController.register)
router.post('/login', UserController.login)

// Protected routes (require authentication)
router.get('/', authMiddleware, UserController.getUsers)
router.get('/:id', authMiddleware, UserController.getUserById)
router.put('/:id', authMiddleware, UserController.updateUser)
router.delete('/:id', authMiddleware, UserController.deleteUser)

export default router
