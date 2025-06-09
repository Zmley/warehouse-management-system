import express from 'express'
import {
  getBin,
  getBinCodes,
  getAvailableBinCodes,
  getBins,
  addBins,
  getPickUpBin,
  checkIfPickUpBin,
  updateDefaultProductCodes,
  deleteBin
} from './bin.controller'
import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from 'constants/uerRole'

import {
  validateProductCodeAndWarehouseID,
  validateBinCodeParam,
  validateUpdateDefaultProductCodes,
  validateWarehouseIDQuery
} from './bin.middleware'

const router = express.Router()

router.get('/codes', validateWarehouseIDQuery, getBinCodes)

router.get('/', validateWarehouseIDQuery, getBins)

router.post('/add', roleAllow([UserRole.ADMIN]), addBins)

router.get('/:binCode', getBin)

router.get(
  '/code/:productCode',
  roleAllow([UserRole.TRANSPORT_WORKER, UserRole.PICKER, UserRole.ADMIN]),
  getAvailableBinCodes
)

router.get(
  '/pickup/:productCode',
  validateProductCodeAndWarehouseID,
  getPickUpBin
)

router.get('/check-pickup/:binCode', validateBinCodeParam, checkIfPickUpBin)

router.patch(
  '/:binID/defaultProductCodes',
  validateUpdateDefaultProductCodes,
  updateDefaultProductCodes
)

router.delete('/:binID', deleteBin)

export default router
