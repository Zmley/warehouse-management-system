import express from 'express'
import { loadCargo, unloadCargo, unloadTaskCargo } from './cart.controller'
import transportWorkerOnly from '../../middlewares/transportWorker.middleware'

const router = express.Router()

router.post('/load', transportWorkerOnly, loadCargo)
router.post('/unload', transportWorkerOnly, unloadCargo)
router.post('/unloadTaskCargo', transportWorkerOnly, unloadTaskCargo)

export default router
