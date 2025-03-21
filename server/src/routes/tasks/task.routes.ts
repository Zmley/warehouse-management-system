import express from 'express'
import { createAsAdmin, acceptTask } from './task.controller'
import transportWorkerOnly from '../../middlewares/transportWorker.middleware'
import adminOnly from '../../middlewares/admin.middleware'

const router = express.Router()

router.post('/createAsAdmin', adminOnly, createAsAdmin)

router.post('/acceptTask', transportWorkerOnly, acceptTask)

export default router
