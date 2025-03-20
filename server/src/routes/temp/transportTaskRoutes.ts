import express from 'express';
import { loadCargo, unloadCargo,scanPickerareaBin,getUserTaskStatus } from '../controllers/transportTaskController'; 
import { authenticateToken } from '../middleware/authMiddleware'; 


const router = express.Router();


router.post('/load-cargo', authenticateToken as any, loadCargo);

router.post('/unload-cargo', authenticateToken as any, unloadCargo);

router.post("/scan-pickerarea-bin", authenticateToken as any, scanPickerareaBin);

router.get("/user-task-status", authenticateToken as any, getUserTaskStatus); // ✅ 获取当前用户的任务状态



export default router;