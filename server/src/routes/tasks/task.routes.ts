import express from 'express'
import * as taskController from './task.controller'
import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from 'constants/index'
import * as taskValidate from 'routes/tasks/task.middleware'

const router = express.Router()

// Transport Worker routes
router.get(
  '/my',
  roleAllow([UserRole.TRANSPORT_WORKER]),
  taskValidate.validateGetMyTask,
  taskController.getMyTask
)

router.post(
  '/:taskID/accept',
  roleAllow([UserRole.TRANSPORT_WORKER]),
  taskValidate.validateAcceptTask,
  taskController.acceptTask
)

// public cancel route
router.post(
  '/:taskID/cancel',
  roleAllow([UserRole.ADMIN, UserRole.PICKER, UserRole.TRANSPORT_WORKER]),
  taskValidate.validateCancelTask,
  taskController.cancelTask
)

router.get(
  '/',
  roleAllow([UserRole.ADMIN, UserRole.TRANSPORT_WORKER, UserRole.PICKER]),
  taskValidate.validateGetTasks,
  taskController.getTasks
)

router.post(
  '/',
  roleAllow([UserRole.ADMIN, UserRole.PICKER, UserRole.TRANSPORT_WORKER]),
  taskValidate.validateCreateTask,
  taskController.createTask
)

router.patch(
  '/:taskID',
  taskValidate.validateUpdateTask,
  taskController.updateTask
)

export default router
