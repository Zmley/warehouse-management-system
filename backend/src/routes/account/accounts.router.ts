import express from 'express'
import { authenticateToken } from '../../middlewares/auth.middleware'
import  currentUser  from '../../middlewares/currentUser.middleware'
import { registerUser, loginUser , getUserInfo} from './accounts.controller'

const router = express.Router()
//public
router.post('/register', registerUser)
router.post('/login', loginUser)


router.get('/me', authenticateToken, currentUser, getUserInfo);

export default router
