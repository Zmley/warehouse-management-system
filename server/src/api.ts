import { Router } from 'express'

import healthCheck from 'routes/healthcheck/healthCheck.router'
import accountRoutes from 'routes/accounts/accounts.router'
import transportRoutes from 'routes/transport/transport.routes'

const router: Router = Router()
router.use(healthCheck)
router.use(accountRoutes)
router.use(transportRoutes)

export default router
