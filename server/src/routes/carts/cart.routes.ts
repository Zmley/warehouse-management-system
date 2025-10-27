import express from 'express'
import { celebrate, Segments } from 'celebrate'
import { load, unload } from './cart.controller'
import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from 'constants/index'
import { CartLoadBodySchema, CartUnloadBodySchema } from './cart.schema'

const router = express.Router()

router.post(
  '/load',
  roleAllow([UserRole.TRANSPORT_WORKER]),
  celebrate({ [Segments.BODY]: CartLoadBodySchema }),
  load
)

router.post(
  '/unload',
  roleAllow([UserRole.TRANSPORT_WORKER]),
  celebrate({ [Segments.BODY]: CartUnloadBodySchema }),
  unload
)

export default router
