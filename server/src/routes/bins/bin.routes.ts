import express from 'express'
import {
  getBin,
  getAvailableBinCodes,
  getBinCodes,
  getBins,
  addBins
} from './bin.controller'
import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from '../../constants/UserRole'

const router = express.Router()

router.get('/:binCode', getBin)

router.get(
  '/code/:productCode',
  roleAllow([UserRole.TRANSPORT_WORKER, UserRole.PICKER]),
  getAvailableBinCodes
)

router.get('/codes', getBinCodes)

router.get('/', getBins)

router.post('/add', addBins)

export default router
