import express from 'express';
import { loadCargo, unloadCargo } from '../controllers/transportTaskController'; // 导入控制器方法
import { authenticateToken } from '../middleware/authMiddleware'; // 引入验证中间件

const router = express.Router();

/**
 * ✅ 路由：上货
 * 需要 JWT 验证
 */
router.post('/load-cargo', authenticateToken as any, loadCargo);

/**
 * ✅ 路由：卸货
 * 需要 JWT 验证
 */
router.post('/unload-cargo', authenticateToken as any, unloadCargo);

export default router;