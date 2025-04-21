import express from 'express'
import {
  getBinByBinCode,
  getBinCodes,
  getBinsForWarehouse
} from './bin.controller'
import roleAllow from 'middlewares/roleAllow.middleware'

const router = express.Router()

router.get('/:binCode', getBinByBinCode)

router.get(
  '/code/:productCode',
  roleAllow(['TRANSPORT_WORKER', 'PICKER']),
  getBinCodes
)

router.get('/', getBinsForWarehouse)

export default router
