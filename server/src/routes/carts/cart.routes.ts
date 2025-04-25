import express from 'express'
import { load, unload } from './cart.controller'
import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from 'constants/uerRole'

const router = express.Router()

router.post('/load', roleAllow([UserRole.TRANSPORT_WORKER]), load)
router.post('/unload', roleAllow([UserRole.TRANSPORT_WORKER]), unload)

export default router
