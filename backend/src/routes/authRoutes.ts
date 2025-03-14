import express from 'express'
import { authenticateToken } from '../middlewares/auth.middleware'
import {
  registerUser,
  loginUser,
  getUserInfo
} from '../controllers/auth.controller'

const router = express.Router()
router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/me', authenticateToken as any, getUserInfo)

export default router
