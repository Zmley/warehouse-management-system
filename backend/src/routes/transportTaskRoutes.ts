import express from 'express';
import { loadCargo, unloadCargo } from '../controllers/transportTaskController'; 
import { authenticateToken } from '../middleware/authMiddleware'; 

const router = express.Router();


router.post('/load-cargo', authenticateToken as any, loadCargo);

router.post('/unload-cargo', authenticateToken as any, unloadCargo);

export default router;