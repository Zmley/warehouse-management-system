import express from 'express'
import {
  createAsAdmin,
  acceptTask,
  createAsPicker,
  getPendingTasks,
  getInProcessTask,
  cancelTask
} from './task.controller'
import transportWorkerOnly from '../../middlewares/transportWorker.middleware'
import pickerOnly from '../../middlewares/picker.middleware'
import adminOnly from '../../middlewares/admin.middleware'

const router = express.Router()

router.post('/createAsAdmin', adminOnly, createAsAdmin)

router.post('/createAsPicker', pickerOnly, createAsPicker)

router.post('/acceptTask', transportWorkerOnly, acceptTask)

router.get('/pending', transportWorkerOnly, getPendingTasks)

router.get('/inprocessTask', transportWorkerOnly, getInProcessTask)

router.post('/cancelTask', transportWorkerOnly, cancelTask)

export default router
