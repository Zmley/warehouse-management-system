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
import warehouse from 'routes/warehouses/warehouse.router'
import log from 'routes/log/log.routes'
import trasnfer from 'routes/transfers/transfer.routes'

const router: Router = Router()
router.use(healthCheck)
router.use(accountRoutes)
router.use(authenticateToken, currentAccount)
router.use('/cart', cart)
router.use('/tasks', task)
router.use('/inventories', inventory)
router.use('/bins', bin)
router.use('/products', product)
router.use('/warehouses', warehouse)
router.use('/logs', log)
router.use('/transfers', trasnfer)

export default router
