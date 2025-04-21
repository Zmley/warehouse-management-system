import express from 'express'
import { load, unload } from './cart.controller'
import roleAllow from 'middlewares/roleAllow.middleware'

const router = express.Router()

router.post('/load', roleAllow(['TRANSPORT_WORKER']), load)
router.post('/unload', roleAllow(['TRANSPORT_WORKER']), unload)

export default router
