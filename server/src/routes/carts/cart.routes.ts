import express from 'express'
import { loadCargo, unloadCargo } from './cart.controller'
import transportWorkerOnly from '../../middlewares/transportWorker.middleware'

const router = express.Router()

router.post('/load', transportWorkerOnly, loadCargo)
router.post('/unload', transportWorkerOnly, unloadCargo)

export default router
