import express from 'express'
import { getBinByCode, getMatchBinCodesByProductCode } from './bin.controller'
import pickerOnly from '../../middlewares/picker.middleware'

const router = express.Router()

router.post('/getBin', getBinByCode)

router.post('/matchBinCode', pickerOnly, getMatchBinCodesByProductCode)

export default router
