import express from 'express'
import { getBin, getBinCodes, getBins } from './bin.controller'
import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from '../../constants/roles'

const router = express.Router()

router.get('/:binCode', getBin)

router.get(
  '/code/:productCode',
  roleAllow([UserRole.TRANSPORT_WORKER, UserRole.PICKER]),
  getBinCodes
)

router.get('/', getBins)

export default router
