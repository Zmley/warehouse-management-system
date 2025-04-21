import express from 'express'
import {
  acceptTask,
  getMyTask,
  cancelTask,
  getTasks,
  createTaskByID
} from './task.controller'
import roleAllow from 'middlewares/roleAllow.middleware'

const router = express.Router()

// Transport Worker routes
router.get('/my', roleAllow(['TRANSPORT_WORKER']), getMyTask)
router.post('/:taskID/accept', roleAllow(['TRANSPORT_WORKER']), acceptTask)

//public
router.post(
  '/:taskID/cancel',
  roleAllow(['ADMIN', 'PICKER', 'TRANSPORT_WORKER']),
  cancelTask
)

router.get('/', roleAllow(['ADMIN', 'TRANSPORT_WORKER', 'PICKER']), getTasks)

router.post('/', roleAllow(['ADMIN', 'PICKER']), createTaskByID)

export default router
