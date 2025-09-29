import express from 'express'
import * as taskController from './task.controller'
import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from 'constants/index'
import { celebrate, Segments } from 'celebrate'

import {
  AcceptTaskParamsSchema,
  CancelTaskParamsSchema,
  GetTasksQuerySchema,
  CreateTaskBodySchema,
  UpdateTaskParamsSchema,
  UpdateTaskBodySchema,
  GetFinishedTasksQuerySchema
} from './task.schema'

const router = express.Router()

router.get(
  '/my',
  roleAllow([UserRole.TRANSPORT_WORKER]),
  taskController.getMyTask
)

router.post(
  '/:taskID/accept',
  roleAllow([UserRole.TRANSPORT_WORKER]),
  celebrate({ [Segments.PARAMS]: AcceptTaskParamsSchema }),
  taskController.acceptTask
)

router.post(
  '/:taskID/cancel',
  roleAllow([UserRole.ADMIN, UserRole.PICKER, UserRole.TRANSPORT_WORKER]),
  celebrate({ [Segments.PARAMS]: CancelTaskParamsSchema }),
  taskController.cancelTask
)

router.get(
  '/finished',
  roleAllow([UserRole.ADMIN]),
  celebrate({ [Segments.QUERY]: GetFinishedTasksQuerySchema }),
  taskController.getFinishedTasksController
)

router.get(
  '/',
  roleAllow([UserRole.ADMIN, UserRole.TRANSPORT_WORKER, UserRole.PICKER]),
  celebrate({ [Segments.QUERY]: GetTasksQuerySchema }),
  (req, res, next) => {
    const { role } = res.locals
    if (role === UserRole.ADMIN) {
      return taskController.getAdminTasks(req, res, next)
    }
    return taskController.getTasks(req, res, next)
  }
)

router.post(
  '/',
  roleAllow([UserRole.ADMIN, UserRole.PICKER, UserRole.TRANSPORT_WORKER]),
  celebrate({ [Segments.BODY]: CreateTaskBodySchema }),
  taskController.createTask
)

router.patch(
  '/:taskID',
  roleAllow([UserRole.ADMIN, UserRole.PICKER, UserRole.TRANSPORT_WORKER]),
  celebrate({
    [Segments.PARAMS]: UpdateTaskParamsSchema,
    [Segments.BODY]: UpdateTaskBodySchema
  }),
  taskController.updateTask
)

export default router
