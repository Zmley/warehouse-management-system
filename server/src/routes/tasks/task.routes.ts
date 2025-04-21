import express from 'express'
import {
  // createAsAdmin,
  acceptTask,
  // createAsPicker,
  getMyTask,
  cancelTaskByTaskID,
  getTasks,
  createTask
} from './task.controller'
import roleAllow from 'middlewares/roleAllow.middleware'

const router = express.Router()

// Transport Worker routes
router.get('/my', roleAllow(['TRANSPORT_WORKER']), getMyTask)
router.post('/:taskID/accept', roleAllow(['TRANSPORT_WORKER']), acceptTask)

// Picker routes
// router.post('/', roleAllow(['PICKER']), createAsPicker)

// Admin routes
// router.post('/admin', roleAllow(['ADMIN']), createAsAdmin)

//common
router.post(
  '/:taskID/cancel',
  roleAllow(['ADMIN', 'PICKER', 'TRANSPORT_WORKER']),
  cancelTaskByTaskID
)

router.get('/', roleAllow(['ADMIN', 'TRANSPORT_WORKER', 'PICKER']), getTasks)

router.post('/', roleAllow(['ADMIN', 'PICKER']), createTask)

export default router
