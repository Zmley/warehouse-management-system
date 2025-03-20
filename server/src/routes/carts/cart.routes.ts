import express from 'express'
import { loadCargo, unloadCargo } from './cart.controller'
import { authenticateToken } from '../../middlewares/auth.middleware'
import currentAccount from 'middlewares/currentAccount.middleware'

const router = express.Router()

router.post('/load', authenticateToken, currentAccount, loadCargo)
router.post('/unload', authenticateToken, currentAccount, unloadCargo)

export default router
