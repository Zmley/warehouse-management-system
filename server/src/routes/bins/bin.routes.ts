import express from 'express'
import {
  getBin,
  getBinCodes,
  getAvailableBinCodes,
  getBins,
  addBins
} from './bin.controller'
import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from 'constants/UserRole'

const router = express.Router()

router.get('/codes', getBinCodes)

router.get('/', getBins)

router.post('/add', roleAllow([UserRole.TRANSPORT_WORKER]), addBins)

router.get('/:binCode', getBin)

router.get(
  '/code/:productCode',
  roleAllow([UserRole.TRANSPORT_WORKER, UserRole.PICKER]),
  getAvailableBinCodes
)

// router.post(
//   '/upload',
//   roleAllow([UserRole.ADMIN]),
//   bulkUploadInventories
// )

export default router
