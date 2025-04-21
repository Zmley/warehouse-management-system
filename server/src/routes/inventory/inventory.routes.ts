import express from 'express'
import {
  getInventoriesByCartID,
  getInventoriesByWarehouseID,
  deleteInventory,
  addInventory,
  updateInventoryByInventoryID
} from './inventory.controller'
// import transportWorkerOnly from '../../middlewares/transportWorker.middleware'
// import adminOnly from 'middlewares/admin.middleware'

import roleAllow from 'middlewares/roleAllow.middleware'

const router = express.Router()

router.get(
  '/inventoriesInCart',
  roleAllow(['TRANSPORT_WORKER']),
  getInventoriesByCartID
)

//admin part

router.get('/', getInventoriesByWarehouseID)

router.delete('/:inventoryID', roleAllow(['ADMIN']), deleteInventory)

router.post('/', addInventory)

router.put('/:inventoryID', updateInventoryByInventoryID)

export default router
