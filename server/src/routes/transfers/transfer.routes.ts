import { Router } from 'express'
import {
  createTransfersController,
  deleteTransfersByTaskController,
  fetchTransfers,
  updateReceiveStatusController
} from './transfer.controller'
import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from 'constants/index'

const router = Router()

router.post(
  '/',
  roleAllow([UserRole.ADMIN, UserRole.TRANSPORT_WORKER]),
  createTransfersController
)

router.get(
  '/',
  roleAllow([UserRole.ADMIN, UserRole.TRANSPORT_WORKER]),
  fetchTransfers
)

router.delete(
  '/:taskID',
  roleAllow([UserRole.ADMIN, UserRole.TRANSPORT_WORKER]),
  deleteTransfersByTaskController
)

router.post('/receive', updateReceiveStatusController)

export default router
