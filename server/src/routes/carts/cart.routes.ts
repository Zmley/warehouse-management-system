import express from 'express'
import { loadCargo, unloadCargo } from './cart.controller'
import { authenticateToken } from '../../middlewares/auth.middleware'
import transportWorkerOnly from '../../middlewares/transportWorker.middleware'
import currentAccount from 'middlewares/currentAccount.middleware'

const router = express.Router()

router.post(
  '/load',
  authenticateToken,
  currentAccount,
  transportWorkerOnly,
  loadCargo
)
router.post(
  '/unload',
  authenticateToken,
  currentAccount,
  transportWorkerOnly,
  unloadCargo
)

export default router
