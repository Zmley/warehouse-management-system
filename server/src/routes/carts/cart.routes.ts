import express from 'express'
import {
  load,
  unloadByWoker,
  unloadByTask,
  getCarCode
} from './cart.controller'
import transportWorkerOnly from '../../middlewares/transportWorker.middleware'

const router = express.Router()

router.post('/load', transportWorkerOnly, load)
router.post('/unload', transportWorkerOnly, unloadByWoker)
router.post('/unloadByTask', transportWorkerOnly, unloadByTask)
router.post('/code', transportWorkerOnly, getCarCode)

export default router
