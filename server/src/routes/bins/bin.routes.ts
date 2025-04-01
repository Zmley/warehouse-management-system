import express from 'express'
import { getBinByCode, getMatchBinCodesByProductCode } from './bin.controller'
import pickerOnly from '../../middlewares/picker.middleware'

const router = express.Router()

router.get('/:binCode', getBinByCode)

router.get('/code/:productCode', pickerOnly, getMatchBinCodesByProductCode)

export default router
