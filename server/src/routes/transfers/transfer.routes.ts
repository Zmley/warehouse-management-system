import { Router } from 'express'
import {
  cancelTransferController,
  confirmReceiveController,
  createTransferController,
  deleteTransfersByTaskController,
  fetchTransfers
} from './transfer.controller'
import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from 'constants/index'

const router = Router()

router.post(
  '/',
  roleAllow([UserRole.ADMIN, UserRole.TRANSPORT_WORKER]),
  createTransferController
)

router.get(
  '/',
  roleAllow([UserRole.ADMIN, UserRole.TRANSPORT_WORKER]),
  fetchTransfers
)

router.post(
  '/:transferID/cancel',
  roleAllow([UserRole.ADMIN, UserRole.TRANSPORT_WORKER]),
  cancelTransferController
)

router.delete(
  '/:taskID',
  roleAllow([UserRole.ADMIN, UserRole.TRANSPORT_WORKER]),
  deleteTransfersByTaskController
)

router.post('/receive', confirmReceiveController)

export default router
