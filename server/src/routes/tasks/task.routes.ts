import express from 'express'
import {
  acceptTask,
  getMyTask,
  cancelTask,
  getTasks,
  createTask,
  updateTask
} from './task.controller'
import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from 'constants/uerRole'

import {
  validateAcceptTask,
  validateCancelTask,
  validateCreateTask,
  validateGetMyTask,
  validateGetTasks,
  validateUpdateTask
} from 'routes/tasks/task.middleware'

const router = express.Router()

// Transport Worker routes
router.get(
  '/my',
  roleAllow([UserRole.TRANSPORT_WORKER]),
  validateGetMyTask,
  getMyTask
)

router.post(
  '/:taskID/accept',
  roleAllow([UserRole.TRANSPORT_WORKER]),
  validateAcceptTask,
  acceptTask
)

// public cancel route
router.post(
  '/:taskID/cancel',
  roleAllow([UserRole.ADMIN, UserRole.PICKER, UserRole.TRANSPORT_WORKER]),
  validateCancelTask,
  cancelTask
)

router.get(
  '/',
  roleAllow([UserRole.ADMIN, UserRole.TRANSPORT_WORKER, UserRole.PICKER]),
  validateGetTasks,
  getTasks
)

router.post(
  '/',
  roleAllow([UserRole.ADMIN, UserRole.PICKER, UserRole.TRANSPORT_WORKER]),
  validateCreateTask,
  createTask
)

router.patch('/:taskID', validateUpdateTask, updateTask)

export default router
