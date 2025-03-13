import express from "express";
import { createPendingTask, getPendingTasks, createPickerTask, acceptTask } from "../controllers/taskController";
import { authenticateToken } from '../middleware/authMiddleware'; 


const router = express.Router();

/**
 * @route POST /api/tasks/create
 * @desc 创建一个新的任务，状态为 "pending"
 */
router.post("/create",authenticateToken as any, createPendingTask);

router.post("/pickerCreate",authenticateToken as any, createPickerTask);

router.post("/acceptTask",authenticateToken as any, acceptTask);



/**
 * @route GET /api/tasks/pending
 * @desc 获取所有状态为 "pending" 的任务
 */
router.get("/pending",authenticateToken as any, getPendingTasks);

export default router;