import express from 'express'
import { authenticateToken } from 'middlewares/auth.middleware'
import currentAccount from 'middlewares/currentAccount.middleware'

import {
  registerUser,
  loginUser,
  getUserInfo,
  refreshAccessToken,
  fetchWorkerNames
} from './accounts.controller'

const router = express.Router()
router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/refresh-token', refreshAccessToken)

router.get('/me', authenticateToken, currentAccount, getUserInfo)

router.get('/names', fetchWorkerNames)

export default router
