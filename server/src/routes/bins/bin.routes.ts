import express from 'express'
import { getBinByCode, getMatchBinCodesByProductCode } from './bin.controller'
import pickerOnly from '../../middlewares/picker.middleware'

const router = express.Router()

router.post('/', getBinByCode)

router.post('/code', pickerOnly, getMatchBinCodesByProductCode)

export default router
