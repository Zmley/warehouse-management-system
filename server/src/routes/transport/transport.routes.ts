import express from 'express'
import { loadCargo, unloadCargo } from './transport.controller'
import { authenticateToken } from '../../middlewares/auth.middleware'
import currentAccount from 'middlewares/currentAccount.middleware'

const router = express.Router()

router.post('/load-cargo', authenticateToken, currentAccount, loadCargo)
router.post('/unload-Cargo', authenticateToken, currentAccount, unloadCargo)

export default router
