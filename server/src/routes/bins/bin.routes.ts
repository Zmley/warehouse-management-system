import express from 'express'
import {
  getBinByBinCode,
  getBinCodes,
  getAllBinsInWarehouse
} from './bin.controller'
import roleAllow from 'middlewares/roleAllow.middleware'

const router = express.Router()

router.get('/:binCode', getBinByBinCode)

router.get(
  '/code/:productCode',
  roleAllow(['TRANSPORT_WORKER', 'PICKER']),
  getBinCodes
)

router.get('/', getAllBinsInWarehouse)

export default router
