import express from 'express'
import { getBin, getBinCodes, getAvailableBinCodes } from './bin.controller'
import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from 'constants/uerRole'

const router = express.Router()

router.get('/codes', getBinCodes)

router.get('/:binCode', getBin)

router.get(
  '/code/:productCode',
  roleAllow([UserRole.TRANSPORT_WORKER, UserRole.PICKER]),
  getAvailableBinCodes
)

export default router
