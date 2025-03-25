import express from 'express'
import {
  loadProduct,
  unloadProductByWoker,
  unloadProductByTask,
  hasProductInCar
} from './cart.controller'
import transportWorkerOnly from '../../middlewares/transportWorker.middleware'

const router = express.Router()

router.post('/load', transportWorkerOnly, loadProduct)
router.post('/unload', transportWorkerOnly, unloadProductByWoker)
router.post('/unloadByTask', transportWorkerOnly, unloadProductByTask)
router.get('/hasProductInCar', transportWorkerOnly, hasProductInCar)

export default router
