import { Router } from 'express'
import currentAccount from 'middlewares/currentAccount.middleware'
import authenticateToken from './middlewares/auth.middleware'
import healthCheck from 'routes/healthcheck/healthCheck.router'
import accountRoutes from 'routes/accounts/accounts.router'
import cart from 'routes/carts/cart.routes'
import task from 'routes/tasks/task.routes'
import inventory from 'routes/inventory/inventory.routes'
import bin from 'routes/bins/bin.routes'
import product from 'routes/products/product.routes'

const router: Router = Router()
router.use(healthCheck)
router.use(accountRoutes)
router.use(authenticateToken, currentAccount)
router.use('/cart', cart)
router.use('/task', task)
router.use('/inventory', inventory)
router.use('/bin', bin)
router.use('/product', product)

export default router
