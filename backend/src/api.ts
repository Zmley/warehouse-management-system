import { Router } from 'express'

import healthCheck from 'routes/healthcheck/healthCheck.router'

const router: Router = Router()
router.use(healthCheck)

export default router
