import express from "express"
import UserController from "../controllers/userController.js"
import authMiddleware from "../middlewares/authMiddleware.js"

const router = express.Router()

router.post("/register", UserController.register)
router.post("/login", UserController.login)
router.put("/profile", authMiddleware, UserController.updateProfile)
router.put("/password", authMiddleware, UserController.updatePassword)

export default router
