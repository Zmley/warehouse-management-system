import express from 'express'
import { authenticateToken } from 'middlewares/auth.middleware'
import currentAccount from 'middlewares/currentAccount.middleware'

import {
  registerUser,
  loginUser,
  getUserInfo,
  refreshAccessToken,
  fetchWorkerNames,
  changeWarehouse
} from './accounts.controller'
import { UserRole } from 'constants/index'
import roleAllow from 'middlewares/roleAllow.middleware'

const router = express.Router()
router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/refresh-token', refreshAccessToken)

router.get('/me', authenticateToken, currentAccount, getUserInfo)

router.get('/names', fetchWorkerNames)

router.post(
  '/changeWarehouse',
  authenticateToken,
  currentAccount,
  roleAllow([UserRole.TRANSPORT_WORKER]),
  changeWarehouse
)

export default router
