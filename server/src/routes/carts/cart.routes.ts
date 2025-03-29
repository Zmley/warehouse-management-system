import express from 'express'
import { load, unload } from './cart.controller'
import transportWorkerOnly from '../../middlewares/transportWorker.middleware'

const router = express.Router()

router.post('/load', transportWorkerOnly, load)
router.post('/unload', transportWorkerOnly, unload)

export default router
