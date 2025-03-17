import express from 'express'
import { authenticateToken } from '../../middlewares/auth.middleware'
import { registerUser, loginUser, getUserInfo } from './accounts.controller'

const router = express.Router()
router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/me', authenticateToken, getUserInfo)

export default router
