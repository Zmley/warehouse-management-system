import express from 'express'
import {
  createAsAdmin,
  acceptTask,
  createAsPicker,
  getTasks,
  getMyTask,
  getPickerCreatedTasks,
  getAllTasks,
  cancelTaskByRole
} from './task.controller'
import roleAllow from 'middlewares/roleAllow.middleware'

const router = express.Router()

// Transport Worker routes
router.get('/', roleAllow(['TRANSPORT_WORKER']), getTasks)
router.get('/my', roleAllow(['TRANSPORT_WORKER']), getMyTask)
router.post('/:taskID/accept', roleAllow(['TRANSPORT_WORKER']), acceptTask)

// Picker routes
router.post('/', roleAllow(['PICKER']), createAsPicker)
router.get('/picker', roleAllow(['PICKER']), getPickerCreatedTasks)

// Admin routes
router.post('/admin', roleAllow(['ADMIN']), createAsAdmin)
router.get('/all', roleAllow(['ADMIN']), getAllTasks)

//common
router.post(
  '/:taskID/cancel',
  roleAllow(['ADMIN', 'PICKER', 'TRANSPORT_WORKER']),
  cancelTaskByRole
)

export default router
