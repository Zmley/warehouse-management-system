import express from 'express'
import {
  acceptTask,
  getMyTask,
  cancelTask,
  getTasks,
  createTask,
  releaseTask
} from './task.controller'
import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from 'constants/uerRole'

const router = express.Router()

// Transport Worker routes
router.get('/my', roleAllow([UserRole.TRANSPORT_WORKER]), getMyTask)
router.post(
  '/:taskID/accept',
  roleAllow([UserRole.TRANSPORT_WORKER]),
  acceptTask
)

// public
router.post(
  '/:taskID/cancel',
  roleAllow([UserRole.ADMIN, UserRole.PICKER, UserRole.TRANSPORT_WORKER]),
  cancelTask
)

router.get(
  '/',
  roleAllow([UserRole.ADMIN, UserRole.TRANSPORT_WORKER, UserRole.PICKER]),
  getTasks
)

router.post(
  '/',
  roleAllow([UserRole.ADMIN, UserRole.PICKER, UserRole.TRANSPORT_WORKER]),
  createTask
)

router.patch('/:taskID/release', releaseTask)

export default router
