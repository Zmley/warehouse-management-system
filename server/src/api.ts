import { Router } from 'express'
import currentAccount from 'middlewares/currentAccount.middleware'
import { authenticateToken } from './middlewares/auth.middleware'
import healthCheck from 'routes/healthcheck/healthCheck.router'
import accountRoutes from 'routes/accounts/accounts.router'
import cart from 'routes/carts/cart.routes'
import task from 'routes/tasks/task.routes'

const router: Router = Router()
router.use(healthCheck)
router.use(accountRoutes)
router.use('/cart', authenticateToken, currentAccount, cart)
router.use('/task', authenticateToken, currentAccount, task)

export default router
