import express from 'express';
import { loadCargo, } from './transport.controller'; 
import { authenticateToken } from '../../middlewares/auth.middleware'; 
import currentAccount from 'middlewares/currentAccount.middleware'



const router = express.Router();


router.post('/load-cargo', authenticateToken ,currentAccount,  loadCargo);

// router.post('/unload-cargo', authenticateToken as any, unloadCargo);

// router.post("/scan-pickerarea-bin", authenticateToken as any, scanPickerareaBin);

// router.get("/user-task-status", authenticateToken as any, getUserTaskStatus); 



export default router;