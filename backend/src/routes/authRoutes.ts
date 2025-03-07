import express from 'express'
import { authenticateToken } from '../middleware/authMiddleware'
import {
  registerUser,
  confirmUser,
  loginUser,
  getUserInfo
} from '../controllers/authController'

const router = express.Router()
router.post('/register', registerUser)
router.post('/confirmUser', confirmUser)
router.post('/login', loginUser)
router.get('/me', authenticateToken as any, getUserInfo)

export default router
