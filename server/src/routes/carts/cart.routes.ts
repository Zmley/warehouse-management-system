import express from 'express'
import { load, unload } from './cart.controller'
import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from 'constants/index'
import { validateLoad, validateUnload } from './cart.middleware'

const router = express.Router()

router.post('/load', roleAllow([UserRole.TRANSPORT_WORKER]), validateLoad, load)

router.post(
  '/unload',
  roleAllow([UserRole.TRANSPORT_WORKER]),
  validateUnload,
  unload
)

export default router
