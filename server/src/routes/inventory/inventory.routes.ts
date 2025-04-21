import express from 'express'
import {
  getInventoriesByCart,
  getInventories,
  deleteInventory,
  addInventory,
  updateInventoryItemController
} from './inventory.controller'
// import transportWorkerOnly from '../../middlewares/transportWorker.middleware'
// import adminOnly from 'middlewares/admin.middleware'

import roleAllow from 'middlewares/roleAllow.middleware'

const router = express.Router()

router.get(
  '/inventoriesInCart',
  roleAllow(['TRANSPORT_WORKER']),
  getInventoriesByCart
)

//admin part

router.get('/', getInventories)

router.delete('/:inventoryID', roleAllow(['ADMIN']), deleteInventory)

router.post('/', addInventory)

router.put('/:inventoryID', updateInventoryItemController)

export default router
