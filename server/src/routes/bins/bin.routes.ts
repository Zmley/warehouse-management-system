import express from 'express'
import { getBin, getAvalibleBinCodes, getBinCodes } from './bin.controller'
import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from 'constants/UserRole'

const router = express.Router()

router.get('/codes', getBinCodes)

router.get(
  '/code/:productCode',
  roleAllow([UserRole.TRANSPORT_WORKER, UserRole.PICKER]),
  getAvalibleBinCodes
)

router.get('/:binCode', getBin)

export default router
