import express from 'express'
import {
  createAsAdmin,
  acceptTask,
  createAsPicker,
  getTasks,
  getMyTask,
  cancelTask,
  cancelPickerTask,
  getPickerCreatedTasks
} from './task.controller'
import transportWorkerOnly from '../../middlewares/transportWorker.middleware'
import pickerOnly from '../../middlewares/picker.middleware'
import adminOnly from '../../middlewares/admin.middleware'

const router = express.Router()

router.post('/createAsAdmin', adminOnly, createAsAdmin)

router.post('/createAsPicker', pickerOnly, createAsPicker)

router.get('/', transportWorkerOnly, getTasks)

router.get('/my', transportWorkerOnly, getMyTask)

router.post('/:taskID/accept', transportWorkerOnly, acceptTask)

router.post('/:taskID/cancel', transportWorkerOnly, cancelTask)

router.post('/', pickerOnly, createAsPicker)

router.post('/:taskID/cancelPicker', pickerOnly, cancelPickerTask)

router.get('/picker', pickerOnly, getPickerCreatedTasks)

export default router
