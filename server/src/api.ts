import { Router } from 'express'

import healthCheck from 'routes/healthcheck/healthCheck.router'
import accountRoutes from 'routes/accounts/accounts.router'
import cart from 'routes/carts/cart.routes'

const router: Router = Router()
router.use(healthCheck)
router.use(accountRoutes)
router.use('/cart', cart)

export default router
