import express from 'express'
import {
  getInventoriesByCartID,
  getInventoriesByWarehouseID,
  deleteInventoryByInventoryID,
  addInventory,
  updateInventoryByInventoryID
} from './inventory.controller'

import roleAllow from 'middlewares/roleAllow.middleware'

const router = express.Router()

router.get(
  '/inventoriesInCart',
  roleAllow(['TRANSPORT_WORKER']),
  getInventoriesByCartID
)

//admin part

router.get('/', getInventoriesByWarehouseID)

router.delete(
  '/:inventoryID',
  roleAllow(['ADMIN']),
  deleteInventoryByInventoryID
)

router.post('/', addInventory)

router.put('/:inventoryID', updateInventoryByInventoryID)

export default router
