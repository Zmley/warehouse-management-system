import express from 'express'
import {
  createAsAdmin,
  acceptTask,
  createAsPicker,
  getPendingTask,
  getCurrentInProcessTask
} from './task.controller'
import transportWorkerOnly from '../../middlewares/transportWorker.middleware'
import pickerOnly from '../../middlewares/picker.middleware'
import adminOnly from '../../middlewares/admin.middleware'

const router = express.Router()

router.post('/createAsAdmin', adminOnly, createAsAdmin)

router.post('/createAsPicker', pickerOnly, createAsPicker)

router.post('/acceptTask', transportWorkerOnly, acceptTask)

router.get('/pending', transportWorkerOnly, getPendingTask)

router.get('/inprocessTask', transportWorkerOnly, getCurrentInProcessTask)

export default router
