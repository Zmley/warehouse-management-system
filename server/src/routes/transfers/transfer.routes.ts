import { Router } from 'express'
import {
  createTransfers,
  deleteTransfersByIDsCtrl,
  fetchTransfers,
  updateReceiveStatus
} from './transfer.controller'
import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from 'constants/index'

const router = Router()

router.post(
  '/',
  roleAllow([UserRole.ADMIN, UserRole.TRANSPORT_WORKER]),
  createTransfers
)

router.get(
  '/',
  roleAllow([UserRole.ADMIN, UserRole.TRANSPORT_WORKER]),
  fetchTransfers
)

router.delete(
  '/',
  roleAllow([UserRole.ADMIN, UserRole.TRANSPORT_WORKER]),
  deleteTransfersByIDsCtrl
)

router.post('/receive', updateReceiveStatus)

export default router
