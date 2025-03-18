import { Router } from 'express';
import authRoutes from './routes/account/accounts.router';

const router: Router = Router()

router.use('/auth', authRoutes); 

export default router;