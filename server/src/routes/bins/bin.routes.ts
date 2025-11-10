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
  deleteBin,
  updateBinController,
  getBinColumns
} from './bin.controller'
import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from 'constants/index'

import {
  validateProductCodeAndWarehouseID,
  validateBinCodeParam,
  validateUpdateDefaultProductCodes,
  validateWarehouseIDQuery
} from './bin.middleware'

const router = express.Router()

router.get('/codes', validateWarehouseIDQuery, getBinCodes)

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

router.patch('/:binID', /* auth, */ updateBinController)

router.get('/columns', getBinColumns)

router.get('/', validateWarehouseIDQuery, getBins)

export default router
