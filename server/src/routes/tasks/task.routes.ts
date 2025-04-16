import express from 'express'
import {
  createAsAdmin,
  acceptTask,
  createAsPicker,
  getMyTask,
  getPickerCreatedTasks,
  cancelTaskByRole,
  getTasksByRole
} from './task.controller'
import roleAllow from 'middlewares/roleAllow.middleware'

const router = express.Router()

// Transport Worker routes
router.get('/my', roleAllow(['TRANSPORT_WORKER']), getMyTask)
router.post('/:taskID/accept', roleAllow(['TRANSPORT_WORKER']), acceptTask)

// Picker routes
router.post('/', roleAllow(['PICKER']), createAsPicker)
router.get('/picker', roleAllow(['PICKER']), getPickerCreatedTasks)

// Admin routes
router.post('/admin', roleAllow(['ADMIN']), createAsAdmin)

//common
router.post(
  '/:taskID/cancel',
  roleAllow(['ADMIN', 'PICKER', 'TRANSPORT_WORKER']),
  cancelTaskByRole
)

router.get(
  '/',
  roleAllow(['ADMIN', 'TRANSPORT_WORKER', 'PICKER']),
  getTasksByRole
)

export default router
