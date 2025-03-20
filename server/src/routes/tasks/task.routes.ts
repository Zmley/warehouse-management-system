import express from 'express'
import {
  createTaskByAdmin,
  acceptTask,
  checkBinAvailable
} from './task.controller'
import transportWorkerOnly from '../../middlewares/transportWorker.middleware'
import adminOnly from '../../middlewares/admin.middleware'

const router = express.Router()

router.post('/adminCreat', adminOnly, createTaskByAdmin)

router.post('/acceptTask', transportWorkerOnly, acceptTask)

//this route is for frontend to check if admin creat the task that is in use, avoding creat task that source bin is in use.
router.post('/checkBinAvalible', adminOnly, checkBinAvailable)

export default router
