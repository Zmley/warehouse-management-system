import express from 'express'
import {
  getBin,
  getBinCodes,
  getAvailableBinCodes,
  getBins,
  addBins,
  getPickUpBin,
  checkIfPickUpBin
} from './bin.controller'
import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from 'constants/uerRole'

const router = express.Router()

router.get('/codes', getBinCodes)

router.get('/', getBins)

router.post('/add', roleAllow([UserRole.ADMIN]), addBins)

router.get('/:binCode', getBin)

router.get(
  '/code/:productCode',
  roleAllow([UserRole.TRANSPORT_WORKER, UserRole.PICKER, UserRole.ADMIN]),
  getAvailableBinCodes
)

router.get('/pickup/:productCode', getPickUpBin)

router.get('/check-pickup/:binCode', checkIfPickUpBin)

export default router
