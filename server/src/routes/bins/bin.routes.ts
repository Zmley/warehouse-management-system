import express from 'express'
import { getBin, getBinCodes, getBins } from './bin.controller'
import roleAllow from 'middlewares/roleAllow.middleware'

const router = express.Router()

router.get('/:binCode', getBin)

router.get(
  '/code/:productCode',
  roleAllow(['TRANSPORT_WORKER', 'PICKER']),
  getBinCodes
)

router.get('/', getBins)

export default router
