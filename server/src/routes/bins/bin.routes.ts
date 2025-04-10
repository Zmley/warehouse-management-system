import express from 'express'
import {
  getBinByCode,
  getBinCodes,
  getBinsForWarehouse
} from './bin.controller'
import pickerOnly from '../../middlewares/picker.middleware'

const router = express.Router()

router.get('/:binCode', getBinByCode)

router.get('/code/:productCode', pickerOnly, getBinCodes)

router.get('/', getBinsForWarehouse)

export default router
