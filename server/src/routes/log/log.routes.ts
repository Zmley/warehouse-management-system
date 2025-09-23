import express from 'express'
import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from 'constants/index'
import { listBySession } from './log.controller'

const router = express.Router()

router.get('/sessions', roleAllow([UserRole.ADMIN]), listBySession)

export default router
